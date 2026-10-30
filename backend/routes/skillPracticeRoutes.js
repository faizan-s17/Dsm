const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const AssessmentMetrics = require('../models/AssessmentMetrics');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// ---- Simple in-memory cache (per server instance) ----
const PRACTICE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const practiceCache = new Map();

function makeCacheKey({ skill, difficulty, category, count }) {
  return `${String(skill).toLowerCase()}::${String(difficulty).toLowerCase()}::${String(category || 'general').toLowerCase()}::${Number(count || 5)}`;
}

function getCached(key) {
  const entry = practiceCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    practiceCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  practiceCache.set(key, {
    data,
    expiresAt: Date.now() + PRACTICE_CACHE_TTL_MS
  });
}


/**
 * @route   GET /api/practice/problems
 * @desc    Get practice problems for a specific skill
 * @access  Private
 */
router.get('/problems', auth, async (req, res) => {
  try {
    const { skill, difficulty = 'medium', category = 'general', count = 1 } = req.query;

    if (!skill) return res.status(400).json({ error: 'Skill is required' });

    // ✅ 1) build cache key
    const key = makeCacheKey({ skill, difficulty, category, count });

    // ✅ 2) serve from cache if available
    const cached = getCached(key);
    if (cached) {
      return res.status(200).json({ problems: cached, cached: true });
    }

    const payload = {
      skill,
      difficulty,
      category,
      count: Number(count || 1),
      type: "coding"
    };

    const pyPath = path.join(__dirname, '..', 'practice_generator.py');
    const pythonExec = (function() {
      if (process.env.PYTHON_EXECUTABLE) return process.env.PYTHON_EXECUTABLE;
      if (process.env.VIRTUAL_ENV) {
        const venvPath = process.env.VIRTUAL_ENV;
        const winPython = path.join(venvPath, 'Scripts', 'python.exe');
        const unixPython = path.join(venvPath, 'bin', 'python');
        if (fs.existsSync(winPython)) return winPython;
        if (fs.existsSync(unixPython)) return unixPython;
      }
      return 'python';
    })();
    const cmd = `${pythonExec.includes(' ') ? '"' + pythonExec + '"' : pythonExec} "${pyPath}" "${JSON.stringify(payload).replace(/"/g, '\\"')}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (stderr) console.error('practice_generator stderr:', stderr);

      if (error) {
        console.error('practice_generator exec error:', error);
        return res.status(500).json({ error: 'Practice generation failed' });
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (e) {
        console.error('Invalid JSON from practice_generator:', stdout);
        return res.status(500).json({ error: 'Invalid generator response' });
      }

      if (parsed.error) return res.status(500).json(parsed);

      const problems = parsed.problems || [];

      // ✅ 3) save to cache
      setCached(key, problems);

      return res.status(200).json({ problems, cached: false });
    });
  } catch (err) {
    console.error('Error generating practice problems:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/practice/evaluate
 * @desc    Evaluate a submitted solution
 * @access  Private
 */


router.post('/evaluate', auth, async (req, res) => {
  try {
    const { skill, solution, timeSpent, problem, antiCheatMetrics } = req.body;

    if (!skill || !solution || !problem) {
      return res.status(400).json({ error: 'skill, solution, and problem are required' });
    }

    const payload = {
      skill,
      difficulty: problem.difficulty || 'medium',
      problem: {
        title: problem.title,
        description: problem.description,
        examples: problem.examples || [],
        tests: problem.tests || []
      },
      solution,
      timeSpent: Number(timeSpent || 0),
      antiCheatMetrics: antiCheatMetrics || {}
    };

    const pyPath = path.join(__dirname, '..', 'practice_evaluator.py');
    const pythonExecEval = (function() {
      if (process.env.PYTHON_EXECUTABLE) return process.env.PYTHON_EXECUTABLE;
      if (process.env.VIRTUAL_ENV) {
        const venvPath = process.env.VIRTUAL_ENV;
        const winPython = path.join(venvPath, 'Scripts', 'python.exe');
        const unixPython = path.join(venvPath, 'bin', 'python');
        if (fs.existsSync(winPython)) return winPython;
        if (fs.existsSync(unixPython)) return unixPython;
      }
      return 'python';
    })();

    // Use spawn to avoid cmd quoting issues on Windows
    const { spawn } = require('child_process');
    const pyProcess = spawn(pythonExecEval, [pyPath, JSON.stringify(payload)], { windowsHide: true });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('practice_evaluator stderr:', data.toString());
    });

    pyProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('practice_evaluator exited with code', code, 'stderr:', stderr);
        return res.status(500).json({ error: 'Practice evaluation failed', details: stderr.slice(0,2000) });
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (e) {
        console.error('Invalid JSON from practice_evaluator:', stdout);
        return res.status(500).json({ error: 'Invalid evaluator response' });
      }

      // ✅ define result HERE (and only use THIS result from now on)
      const result = {
        score: Number(parsed.score ?? 0),
        passed: !!parsed.passed,
        feedback: parsed.feedback || '',
        metrics: parsed.metrics || {}
      };

      // Update user profile
      try {
        const user = await User.findById(req.user.userId); // ✅ userId fix

        if (user) {
          const idx = user.skillScores.findIndex(s =>
            s.skill.toLowerCase() === skill.toLowerCase()
          );

          if (idx !== -1) {
            const currentScore = user.skillScores[idx].score;
            const newScore = Math.round((currentScore * 0.7) + (result.score * 0.3));

            user.skillScores[idx].score = newScore;
            user.skillScores[idx].assessedAt = new Date();
          } else {
            user.skillScores.push({
              skill,
              score: result.score,
              assessedAt: new Date()
            });
          }

          user.recentActivity.unshift({
            type: 'practice',
            description: `Completed ${skill} practice problem (${problem.title || 'Practice'})`,
            date: new Date()
          });

          if (user.recentActivity.length > 10) {
            user.recentActivity = user.recentActivity.slice(0, 10);
          }

          await user.save();
        }
      } catch (profileError) {
        console.error('Error updating user profile with practice results:', profileError);
        // do not crash, still return evaluation result
      }

      // Save practice metrics to database for model training
      try {
        const practiceMetrics = new AssessmentMetrics({
          userId: req.user.userId,
          assessmentId: `practice_${Date.now()}_${req.user.userId}`,
          assessmentDate: new Date(),
          totalQuestions: 1, // For practice, we consider one problem
          timeMetrics: {
            totalTime: timeSpent || 0,
            avgTimePerQuestion: timeSpent || 0,
            questionTimeSpent: [{
              questionIndex: 0,
              timeSpent: timeSpent || 0
            }]
          },
          confidenceMetrics: {
            avgConfidence: result.metrics?.antiCheatScore || 100,
            confidenceFactors: {
              antiCheatImpact: antiCheatMetrics ? 100 - (antiCheatMetrics.tabSwitches * 2 + antiCheatMetrics.focusLost * 1 + antiCheatMetrics.copyAttempts * 2 + antiCheatMetrics.pasteAttempts * 2) : 100
            }
          },
          antiCheatMetrics: antiCheatMetrics || {
            tabSwitches: 0,
            copyAttempts: 0,
            pasteAttempts: 0,
            focusLost: 0,
            warningLevel: 0,
            totalViolations: 0,
            focusScore: 100
          },
          focusScore: result.metrics?.focusScore || 100,
          assessmentDetails: {
            experienceLevel: 'Practice',
            questionType: 'coding',
            skillsAssessed: [skill],
            totalScore: result.score,
            skillScores: [{ skill, score: result.score }]
          },
          performanceIndicators: {
            accuracyRate: result.score,
            completionRate: 100 // Since practice problem was completed
          },
          metadata: {
            userAgent: req.get('User-Agent'),
            deviceType: req.body.deviceType || 'unknown',
            browser: req.body.browser || 'unknown',
            os: req.body.os || 'unknown'
          }
        });
        
        await practiceMetrics.save();
        console.log('Practice metrics saved successfully');
      } catch (metricsError) {
        console.error('Error saving practice metrics:', metricsError);
        // Don't fail the main request if metrics saving fails
      }

      // ✅ Only response send point
      return res.status(200).json({ result });
    });

  } catch (err) {
    console.error('Error evaluating solution:', err);
    return res.status(500).json({ error: 'Server error' });
  }


});
  module.exports = router;