const crypto = require('crypto');
const SkillReport = require('../models/SkillReport');
const { calculateAverageSkillScore, getBadgeFromAvg } = require('./badgeUtils');

const generatePublicId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const calculateAvgSkillScore = (skillScores = []) => {
  return calculateAverageSkillScore(skillScores);
};

const getTopSkills = (skillScores = [], topN = 5) => {
  if (!Array.isArray(skillScores)) return [];
  return [...skillScores]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topN)
    .map(s => ({ skill: s.skill, score: s.score }));
};

const buildTimeline = (skillScores = []) => {
  // Build a simple timeline of average score by assessedAt date (grouped by date)
  if (!Array.isArray(skillScores)) return [];

  const byDate = {};
  for (const s of skillScores) {
    const d = s.assessedAt ? new Date(s.assessedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
    if (!byDate[d]) byDate[d] = { total: 0, count: 0 };
    byDate[d].total += Number(s.score || 0);
    byDate[d].count += 1;
  }

  const timeline = Object.keys(byDate).sort().map(date => ({ date: new Date(date), avgScore: Math.round((byDate[date].total / byDate[date].count) * 100) / 100 }));
  return timeline;
};

const buildSkillScoresSnapshot = (skillScores = []) => {
  return (Array.isArray(skillScores) ? skillScores : []).map(s => ({ skill: s.skill, score: s.score, assessedAt: s.assessedAt }));
};

const generateSkillReportForUser = async (user) => {
  if (!user || !user._id) throw new Error('Invalid user');

  const snapshot = buildSkillScoresSnapshot(user.skillScores || []);
  const avg = calculateAvgSkillScore(snapshot);
  const badge = user.badge && user.badge.name ? user.badge : getBadgeFromAvg(avg);
  const topSkills = getTopSkills(snapshot, 5);
  const timeline = buildTimeline(snapshot);

  // Ensure unique publicId
  let publicId = generatePublicId();
  let exists = await SkillReport.findOne({ publicId });
  let attempts = 0;
  while (exists && attempts < 5) {
    publicId = generatePublicId();
    exists = await SkillReport.findOne({ publicId });
    attempts += 1;
  }

  const report = new SkillReport({
    userId: user._id,
    publicId,
    badge: { name: badge.name, icon: badge.icon },
    avgSkillScore: avg,
    topSkills,
    timeline,
    skillScoresSnapshot: snapshot,
    isActive: true
  });

  await report.save();
  return report;
};

module.exports = {
  calculateAvgSkillScore,
  getTopSkills,
  buildTimeline,
  generateSkillReportForUser
};
