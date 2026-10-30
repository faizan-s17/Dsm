const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const AssessmentMetrics = require('../models/AssessmentMetrics');
const Course = require('../models/courses');
const Job = require('../models/Job');
const path = require('path');
const { applyBadgeToUser } = require('../utils/badgeUtils');
const { generateSkillReportForUser } = require('../utils/reportUtils');

// Helper to resolve a Python executable (prefer virtualenv if available)
function getPythonExecutable() {
    if (process.env.PYTHON_EXECUTABLE) return process.env.PYTHON_EXECUTABLE;
    if (process.env.VIRTUAL_ENV) {
        const venvPath = process.env.VIRTUAL_ENV;
        const winPython = path.join(venvPath, 'Scripts', 'python.exe');
        const unixPython = path.join(venvPath, 'bin', 'python');
        if (fs.existsSync(winPython)) return winPython;
        if (fs.existsSync(unixPython)) return unixPython;
    }
    return 'python';
}

// Helper function to run the Python script
const runPythonScript = (data) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '..', 'skill_assessment.py');
        let jsonData = JSON.stringify(data);
        
        // Escape JSON data differently for Windows and Unix
        if (process.platform === 'win32') {
            // For Windows (PowerShell/CMD)
            jsonData = jsonData.replace(/"/g, '\\"');
            jsonData = `"${jsonData}"`;
        } else {
            // For Unix systems
            jsonData = `'${jsonData}'`;
        }
        
        console.log(`Running python script with data: ${jsonData}`);
        
        // Resolve python executable (prefer venv when available)
        const pythonExec = getPythonExecutable();
        const command = `${pythonExec.includes(' ') ? '"' + pythonExec + '"' : pythonExec} "${pythonScript}" ${jsonData}`;
            
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                console.error(`stderr: ${stderr}`);
                
                // Fallback to hardcoded questions if the script fails
                return resolve({
                    "questions": [
                        {
                            "Skill": "JavaScript", 
                            "Question": "Which of the following is not a JavaScript data type?",
                            "Type": "mcq",
                            "Options": ["String", "Boolean", "Character", "Number"],
                            "CorrectAnswer": "Character"
                        },
                        {
                            "Skill": "JavaScript", 
                            "Question": "Explain the difference between let, const, and var in JavaScript.",
                            "Type": "open_ended"
                        },
                        {
                            "Skill": "JavaScript", 
                            "Question": "Which method is used to add an element to the end of an array?",
                            "Type": "mcq",
                            "Options": ["push()", "pop()", "unshift()", "shift()"],
                            "CorrectAnswer": "push()"
                        }
                    ]
                });
            }
            
            console.log(`Python script output: ${stdout}`);
            
            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                console.error(`Error parsing Python output: ${parseError.message}`);
                console.error(`Raw output: ${stdout}`);
                
                // Fallback to hardcoded questions if JSON parsing fails
                resolve({
                    "questions": [
                        {
                            "Skill": "JavaScript", 
                            "Question": "Which of the following is not a JavaScript data type?",
                            "Type": "mcq",
                            "Options": ["String", "Boolean", "Character", "Number"],
                            "CorrectAnswer": "Character"
                        },
                        {
                            "Skill": "JavaScript", 
                            "Question": "Explain the difference between let, const, and var in JavaScript.",
                            "Type": "open_ended"
                        }
                        
                    ]
                });
            }
        });
    });
};

// Get assessment questions based on user skills
router.post('/get_questions', auth, async (req, res) => {
    try {
        // Get the authenticated user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If no skills are provided, use the user's registered skills
        const skills = user.skills || [];
        
        if (!skills.length) {
            return res.status(400).json({ error: 'No skills found for assessment. Please update your profile with skills.' });
        }

        // Get optional parameters from request
        const questionTypes = req.body.questionTypes || ['mcq', 'open_ended'];
        const jobDescription = req.body.jobDescription;

        // Call the Python script to generate questions
        const result = await runPythonScript({
            command: 'generate_questions',
            skills,
            question_types: questionTypes,
            job_description: jobDescription,
            experienceLevel: req.body.experienceLevel || 'Intermediate'
        });

        // Check for errors from the Python script
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        // Save generated questions as a draft AssessmentMetrics so we can link answers later
        try {
            const assessmentId = `assessment_${Date.now()}_${user._id}`;
            const totalQuestions = Array.isArray(result.questions) ? result.questions.length : 0;

            // Determine question type summary
            let qType = 'mixed';
            if (totalQuestions > 0) {
                const types = new Set((result.questions || []).map(q => (q.Type || q.type || '').toLowerCase()));
                if (types.size === 1) qType = types.values().next().value || 'mixed';
                else qType = 'mixed';
            }

            const draft = new AssessmentMetrics({
                userId: user._id,
                assessmentId,
                assessmentDate: new Date(),
                totalQuestions: totalQuestions || 0,
                timeMetrics: {
                    totalTime: 0,
                    avgTimePerQuestion: 0,
                    questionTimeSpent: []
                },
                confidenceMetrics: {
                    avgConfidence: 75,
                    confidenceFactors: { antiCheatImpact: 0 }
                },
                antiCheatMetrics: {
                    tabSwitches: 0,
                    copyAttempts: 0,
                    pasteAttempts: 0,
                    focusLost: 0,
                    warningLevel: 0,
                    totalViolations: 0
                },
                focusScore: 100,
                assessmentDetails: {
                    experienceLevel: req.body.experienceLevel || 'Intermediate',
                    questionType: qType,
                    skillsAssessed: skills,
                    totalScore: 0,
                    skillScores: []
                },
                performanceIndicators: {
                    accuracyRate: 0,
                    completionRate: 0
                },
                metadata: {
                    userAgent: req.get('User-Agent'),
                    deviceType: req.body.deviceType || 'unknown',
                    browser: req.body.browser || 'unknown',
                    os: req.body.os || 'unknown'
                },
                generatedQuestions: result.questions || [],
                submittedAnswers: []
            });

            await draft.save();

            // Return the questions and assessmentId so frontend can send it back on submit
            return res.json({ ...result, assessmentId });
        } catch (saveErr) {
            console.error('Error saving draft assessment metrics:', saveErr);
            // Fallback: still return questions without assessmentId
            return res.json(result);
        }
    } catch (error) {
        console.error('Error getting assessment questions:', error);
        res.status(500).json({ error: error.message || 'Error getting assessment questions' });
    }
});

// Submit assessment answers for evaluation
router.post('/assess', auth, async (req, res) => {
    try {
        const { answers, questions } = req.body;
        
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Answers must be provided as an array' });
        }
        
        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Questions must be provided as an array' });
        }

        // Get the authenticated user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Call the Python script to evaluate answers
        const result = await runPythonScript({
            command: 'evaluate_answers',
            questions,
            answers,
            user_level: req.body.user_level || 'Intermediate'
        });

        // Check for errors from the Python script
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        // Save scores to user profile
        if (result.scores) {
            // Create an array to track updated skills for activity log
            const updatedSkills = [];
            
            for (const skill in result.scores) {
                const score = result.scores[skill];
                updatedSkills.push(skill);
                
                // Check if skill score already exists
                const existingScoreIndex = user.skillScores ? 
                    user.skillScores.findIndex(item => item.skill === skill) : -1;
                
                if (existingScoreIndex !== -1) {
                    // Update existing score
                    user.skillScores[existingScoreIndex].score = score;
                    user.skillScores[existingScoreIndex].assessedAt = new Date();
                } else {
                    // Add new score
                    if (!user.skillScores) {
                        user.skillScores = [];
                    }
                    
                    user.skillScores.push({
                        skill,
                        score,
                        assessedAt: new Date()
                    });
                }
            }
            
            // Add activity record for the assessment
            if (!user.recentActivity) {
                user.recentActivity = [];
            }
            
            const skillsList = updatedSkills.join(', ');
            user.recentActivity.unshift({
                type: 'assessment',
                description: `Completed skill assessment for ${skillsList}`,
                date: new Date()
            });
            
            // Limit activity to most recent 10 items
            if (user.recentActivity.length > 10) {
                user.recentActivity = user.recentActivity.slice(0, 10);
            }
            
            // Recalculate badge based on updated skill scores
            applyBadgeToUser(user);
                        await user.save();
                        // Generate a public skill report (best-effort)
                        try {
                            await generateSkillReportForUser(user);
                        } catch (reportErr) {
                            console.error('Error generating skill report after assessment:', reportErr);
                        }
        }

        // Get actual course recommendations from database
        if (result.recommended_courses) {
            try {
                // Get user's top skills based on scores
                const topSkills = Object.entries(result.scores || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill]) => skill);
                
                // Find courses matching these skills
                const courses = await Course.find({
                    skills: { $in: topSkills }
                }).limit(5);
                
                if (courses.length > 0) {
                    result.db_courses = courses.map(course => ({
                        id: course._id,
                        title: course.title,
                        description: course.description,
                        provider: course.category,
                        thumbnail: course.thumbnail,
                        url: course.courseLink || course.youtubeUrl,
                        rationale: `This course is recommended because it matches your ${
                            course.skills.filter(s => topSkills.includes(s)).join(', ')
                        } skills which you performed well in.`
                    }));
                }
            } catch (error) {
                console.error('Error fetching course recommendations:', error);
            }
        }

        // Get actual job recommendations from database
        if (result.recommended_jobs) {
            try {
                // Get user's top skills based on scores
                const topSkills = Object.entries(result.scores || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill]) => skill);
                
                // Find active jobs matching these skills
                const jobs = await Job.find({
                    skills: { $in: topSkills },
                    status: 'active',
                    verified: true,
                    expiryDate: { $gt: new Date() }
                }).limit(5);
                
                if (jobs.length > 0) {
                    result.db_jobs = jobs.map(job => ({
                        id: job._id,
                        jobTitle: job.jobTitle,
                        companyName: job.companyName,
                        description: job.jobDescription,
                        rationale: `This job is recommended because it requires ${
                            job.skills.filter(s => topSkills.includes(s)).join(', ')
                        } which match your skills assessment results.`
                    }));
                }
            } catch (error) {
                console.error('Error fetching job recommendations:', error);
            }
        }

        // Save assessment metrics to database for model training
        try {
            const providedAssessmentId = req.body.assessmentId || req.body.assessmentMetrics?.assessmentId;

            if (providedAssessmentId) {
                // Update existing draft assessment created earlier in /get_questions
                const updateFields = {
                    totalQuestions: questions.length,
                    'timeMetrics.totalTime': req.body.assessmentMetrics?.totalAssessmentTime || 0,
                    'timeMetrics.avgTimePerQuestion': req.body.assessmentMetrics?.avgTimePerQuestion || 0,
                    'timeMetrics.questionTimeSpent': req.body.assessmentMetrics?.questionTimeSpent || [],
                    'confidenceMetrics.avgConfidence': req.body.assessmentMetrics?.avgConfidence || result.confidence || 75,
                    'confidenceMetrics.confidenceFactors.antiCheatImpact': req.body.assessmentMetrics?.avgConfidence ? 100 - req.body.assessmentMetrics.avgConfidence : 25,
                    antiCheatMetrics: req.body.assessmentMetrics?.antiCheat || (result.antiCheatMetrics || {
                        tabSwitches: 0, copyAttempts: 0, pasteAttempts: 0, focusLost: 0, warningLevel: 0, totalViolations: 0
                    }),
                    focusScore: req.body.assessmentMetrics?.focusScore || result.focusScore || 100,
                    'assessmentDetails.totalScore': result.overallScore || result.totalScore || 0,
                    'assessmentDetails.skillScores': Object.entries(result.scores || {}).map(([skill, score]) => ({ skill, score })),
                    'performanceIndicators.accuracyRate': result.overallScore || result.totalScore || 0,
                    'performanceIndicators.completionRate': 100,
                    submittedAnswers: (Array.isArray(answers) ? answers.map((ans, idx) => ({ question: questions[idx] || null, answer: ans })) : [])
                };

                const updated = await AssessmentMetrics.findOneAndUpdate(
                    { assessmentId: providedAssessmentId, userId: req.user.userId },
                    { $set: updateFields },
                    { new: true }
                );

                if (updated) {
                    console.log('Assessment metrics updated for', providedAssessmentId);
                } else {
                    // If not found, create a new record as fallback
                    const assessmentMetrics = new AssessmentMetrics({
                        userId: req.user.userId,
                        assessmentId: providedAssessmentId,
                        assessmentDate: new Date(),
                        totalQuestions: questions.length,
                        timeMetrics: {
                            totalTime: req.body.assessmentMetrics?.totalAssessmentTime || 0,
                            avgTimePerQuestion: req.body.assessmentMetrics?.avgTimePerQuestion || 0,
                            questionTimeSpent: req.body.assessmentMetrics?.questionTimeSpent || []
                        },
                        confidenceMetrics: {
                            avgConfidence: req.body.assessmentMetrics?.avgConfidence || 75,
                            confidenceFactors: {
                                antiCheatImpact: req.body.assessmentMetrics?.avgConfidence ? 100 - req.body.assessmentMetrics.avgConfidence : 25
                            }
                        },
                        antiCheatMetrics: req.body.assessmentMetrics?.antiCheat || {
                            tabSwitches: 0,
                            copyAttempts: 0,
                            pasteAttempts: 0,
                            focusLost: 0,
                            warningLevel: 0,
                            totalViolations: 0
                        },
                        focusScore: req.body.assessmentMetrics?.focusScore || 100,
                        assessmentDetails: {
                            experienceLevel: req.body.experienceLevel || 'Intermediate',
                            questionType: 'mixed',
                            skillsAssessed: [...new Set(questions.map(q => q.Skill))],
                            totalScore: result.totalScore || 0,
                            skillScores: Object.entries(result.scores || {}).map(([skill, score]) => ({ skill, score }))
                        },
                        performanceIndicators: {
                            accuracyRate: result.accuracyRate || 0,
                            completionRate: 100
                        },
                        metadata: {
                            userAgent: req.get('User-Agent'),
                            deviceType: req.body.deviceType || 'unknown',
                            browser: req.body.browser || 'unknown',
                            os: req.body.os || 'unknown'
                        },
                        generatedQuestions: questions || [],
                        submittedAnswers: (Array.isArray(answers) ? answers.map((ans, idx) => ({ question: questions[idx] || null, answer: ans })) : [])
                    });
                    await assessmentMetrics.save();
                    console.log('Assessment metrics created as fallback');
                }
            } else {
                // No assessmentId provided - create a fresh metrics document
                const assessmentMetrics = new AssessmentMetrics({
                    userId: req.user.userId,
                    assessmentId: `assessment_${Date.now()}_${req.user.userId}`,
                    assessmentDate: new Date(),
                    totalQuestions: questions.length,
                    timeMetrics: {
                        totalTime: req.body.assessmentMetrics?.totalAssessmentTime || 0,
                        avgTimePerQuestion: req.body.assessmentMetrics?.avgTimePerQuestion || 0,
                        questionTimeSpent: req.body.assessmentMetrics?.questionTimeSpent || []
                    },
                    confidenceMetrics: {
                        avgConfidence: req.body.assessmentMetrics?.avgConfidence || 75,
                        confidenceFactors: {
                            antiCheatImpact: req.body.assessmentMetrics?.avgConfidence ? 100 - req.body.assessmentMetrics.avgConfidence : 25
                        }
                    },
                    antiCheatMetrics: req.body.assessmentMetrics?.antiCheat || {
                        tabSwitches: 0,
                        copyAttempts: 0,
                        pasteAttempts: 0,
                        focusLost: 0,
                        warningLevel: 0,
                        totalViolations: 0
                    },
                    focusScore: req.body.assessmentMetrics?.focusScore || 100,
                    assessmentDetails: {
                        experienceLevel: req.body.experienceLevel || 'Intermediate',
                        questionType: 'mixed', // Determine from questions
                        skillsAssessed: [...new Set(questions.map(q => q.Skill))],
                        totalScore: result.totalScore || 0,
                        skillScores: Object.entries(result.scores || {}).map(([skill, score]) => ({ skill, score }))
                    },
                    performanceIndicators: {
                        accuracyRate: result.accuracyRate || 0,
                        completionRate: 100 // Since assessment was submitted
                    },
                    metadata: {
                        userAgent: req.get('User-Agent'),
                        deviceType: req.body.deviceType || 'unknown',
                        browser: req.body.browser || 'unknown',
                        os: req.body.os || 'unknown'
                    },
                    generatedQuestions: questions || [],
                    submittedAnswers: (Array.isArray(answers) ? answers.map((ans, idx) => ({ question: questions[idx] || null, answer: ans })) : [])
                });

                await assessmentMetrics.save();
                console.log('Assessment metrics saved successfully');
            }
        } catch (metricsError) {
            console.error('Error saving assessment metrics:', metricsError);
            // Don't fail the main request if metrics saving fails
        }

        res.json(result);
    } catch (error) {
        console.error('Error processing assessment:', error);
        res.status(500).json({ error: error.message || 'Error processing assessment' });
    }
});

// Get user's skill assessment results
router.get('/results', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!user.skillScores || user.skillScores.length === 0) {
            return res.status(404).json({ message: 'No assessment results found. Please complete an assessment first.' });
        }
        
        res.json({ skillScores: user.skillScores });
    } catch (error) {
        console.error('Error fetching assessment results:', error);
        res.status(500).json({ error: error.message || 'Error fetching assessment results' });
    }
});

// Get recommendations based on skill scores
router.get('/recommendations', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!user.skillScores || user.skillScores.length === 0) {
            return res.status(404).json({ message: 'No assessment results found. Please complete an assessment first.' });
        }
        
        // Get user's skills and scores in the format required by the Python script
        const skills = user.skillScores.map(item => item.skill);
        const scores = user.skillScores.reduce((acc, item) => {
            acc[item.skill] = item.score;
            return acc;
        }, {});
        
        // Call the Python script to get recommendations
        const result = await runPythonScript({
            command: 'evaluate_answers',  // We use this command to get recommendations too
            skills,
            answers: skills.map(() => ""),  // Dummy answers just to make the script work
            user_level: 'Intermediate'
        });
        
        // Check for errors from the Python script
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }
        
        // Get actual course recommendations from database
        if (result.recommended_courses) {
            try {
                // Get user's top skills based on scores
                const topSkills = Object.entries(scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill]) => skill);
                
                // Find courses matching these skills
                const courses = await Course.find({
                    skills: { $in: topSkills }
                }).limit(5);
                
                if (courses.length > 0) {
                    result.db_courses = courses.map(course => ({
                        id: course._id,
                        title: course.title,
                        description: course.description,
                        provider: course.category,
                        thumbnail: course.thumbnail,
                        url: course.courseLink || course.youtubeUrl
                    }));
                }
            } catch (error) {
                console.error('Error fetching course recommendations:', error);
            }
        }
        
        // Get actual job recommendations from database
        if (result.recommended_jobs) {
            try {
                // Get user's top skills based on scores
                const topSkills = Object.entries(scores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([skill]) => skill);
                
                // Find active jobs matching these skills
                const jobs = await Job.find({
                    skills: { $in: topSkills },
                    status: 'active',
                    verified: true,
                    expiryDate: { $gt: new Date() }
                }).limit(5);
                
                if (jobs.length > 0) {
                    result.db_jobs = jobs.map(job => ({
                        id: job._id,
                        jobTitle: job.jobTitle,
                        companyName: job.companyName,
                        description: job.jobDescription
                    }));
                }
            } catch (error) {
                console.error('Error fetching job recommendations:', error);
            }
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: error.message || 'Error fetching recommendations' });
    }
});

// Update user skill scores directly
router.post('/update-skill-scores', auth, async (req, res) => {
    try {
        const { skillScores } = req.body;
        
        if (!skillScores || !Array.isArray(skillScores)) {
            return res.status(400).json({ error: 'Skill scores must be provided as an array' });
        }
        
        // Get the authenticated user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Initialize skillScores array if it doesn't exist
        if (!user.skillScores) {
            user.skillScores = [];
        }
        
        // Update or add skill scores
        const updatedSkills = [];
        
        for (const { skill, score } of skillScores) {
            if (!skill || typeof score !== 'number') {
                continue; // Skip invalid entries
            }
            
            updatedSkills.push(skill);
            
            // Check if skill score already exists
            const existingScoreIndex = user.skillScores.findIndex(item => item.skill === skill);
            
            if (existingScoreIndex !== -1) {
                // Update existing score
                user.skillScores[existingScoreIndex].score = score;
                user.skillScores[existingScoreIndex].assessedAt = new Date();
            } else {
                // Add new score
                user.skillScores.push({
                    skill,
                    score,
                    assessedAt: new Date()
                });
            }
        }
        
        // Add activity record for the assessment if skills were updated
        if (updatedSkills.length > 0) {
            if (!user.recentActivity) {
                user.recentActivity = [];
            }
            
            const skillsList = updatedSkills.join(', ');
            user.recentActivity.unshift({
                type: 'assessment',
                description: `Updated skill assessment scores for ${skillsList}`,
                date: new Date()
            });
            
            // Limit activity to most recent 10 items
            if (user.recentActivity.length > 10) {
                user.recentActivity = user.recentActivity.slice(0, 10);
            }
        }
        
        // Recalculate badge based on updated skill scores
        applyBadgeToUser(user);
                await user.save();
                // Generate a public skill report (best-effort)
                try {
                    await generateSkillReportForUser(user);
                } catch (reportErr) {
                    console.error('Error generating skill report after update-skill-scores:', reportErr);
                }
        
        res.json({ success: true, message: 'Skill scores updated successfully' });
    } catch (error) {
        console.error('Error updating skill scores:', error);
        res.status(500).json({ error: error.message || 'Error updating skill scores' });
    }
});

// Get assessment metrics for a user
router.get('/metrics', auth, async (req, res) => {
    try {
        const { assessmentId } = req.query;
        
        let metricsQuery = { userId: req.user.userId };
        
        if (assessmentId) {
            metricsQuery.assessmentId = assessmentId;
        }
        
        const metrics = await AssessmentMetrics.find(metricsQuery)
            .sort({ createdAt: -1 })
            .limit(10); // Return last 10 assessments
        
        if (!metrics || metrics.length === 0) {
            return res.status(404).json({ message: 'No assessment metrics found' });
        }
        
        res.json({ metrics });
    } catch (error) {
        console.error('Error fetching assessment metrics:', error);
        res.status(500).json({ error: error.message || 'Error fetching assessment metrics' });
    }
});

module.exports = router; 