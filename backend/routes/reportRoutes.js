const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const SkillReport = require('../models/SkillReport');
const { generateSkillReportForUser } = require('../utils/reportUtils');

// POST /api/user/report/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const report = await generateSkillReportForUser(user);

    const frontend = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    const publicUrl = `${frontend.replace(/\/$/, '')}/verify/${report.publicId}`;

    res.json({ publicUrl, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message || 'Error generating report' });
  }
});

// GET /api/user/report/latest
router.get('/latest', auth, async (req, res) => {
  try {
    const report = await SkillReport.findOne({ userId: req.user.userId, isActive: true }).sort({ createdAt: -1 });
    if (!report) return res.status(404).json({ message: 'No active report found' });
    const frontend = process.env.FRONTEND_URL || process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';
    const publicUrl = `${frontend.replace(/\/$/, '')}/verify/${report.publicId}`;
    res.json({ publicUrl, report });
  } catch (error) {
    console.error('Error fetching latest report:', error);
    res.status(500).json({ error: error.message || 'Error fetching latest report' });
  }
});

module.exports = router;