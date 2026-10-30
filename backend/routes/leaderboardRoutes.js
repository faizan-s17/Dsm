const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { listAvailableSkills, generateLeaderboardSnapshot, normalizeSkillName } = require('../utils/leaderboardUtils');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');

// GET /api/leaderboard/skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await listAvailableSkills();
    res.json({ skills });
  } catch (error) {
    console.error('Error listing skills:', error);
    res.status(500).json({ error: error.message || 'Error listing skills' });
  }
});

// GET /api/leaderboard/:period/:skill
router.get('/:period/:skill', async (req, res) => {
  try {
    const { period, skill } = req.params;
    if (!['weekly','monthly'].includes(period)) return res.status(400).json({ error: 'Invalid period' });
    const normalized = normalizeSkillName(skill);

    // compute current period range
    const { startDate, endDate } = require('../utils/leaderboardUtils').getPeriodRange(period, new Date());

    // find snapshot
    let snapshot = await LeaderboardSnapshot.findOne({ period, skill: normalized, startDate, endDate }).lean();
    if (!snapshot) {
      snapshot = await generateLeaderboardSnapshot(period, normalized);
    }

    res.json({ period, skill: normalized, startDate: snapshot.startDate, endDate: snapshot.endDate, entries: snapshot.entries || [] });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message || 'Error fetching leaderboard' });
  }
});

// POST /api/admin/leaderboard/regenerate - regenerate all skills for weekly & monthly (admin only)
router.post('/admin/regenerate', auth, authorize('admin'), async (req, res) => {
  try {
    const skills = await listAvailableSkills();
    const results = [];
    for (const period of ['weekly','monthly']) {
      for (const skill of skills) {
        const snapshot = await generateLeaderboardSnapshot(period, skill);
        results.push({ period, skill, id: snapshot._id });
      }
    }
    res.json({ success: true, generated: results.length });
  } catch (error) {
    console.error('Error regenerating leaderboards:', error);
    res.status(500).json({ error: error.message || 'Error regenerating leaderboards' });
  }
});

module.exports = router;
