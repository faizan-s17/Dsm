const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const User = require('../models/User');
const { calculateAverageSkillScore } = require('./badgeUtils');

const normalizeSkillName = (skill = '') => (String(skill || '').toLowerCase().trim());

const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPeriodRange = (period = 'weekly', nowDate = new Date()) => {
  const end = new Date(nowDate);
  const start = new Date(nowDate);
  if (period === 'weekly') {
    start.setDate(end.getDate() - 6); // include today and previous 6 days = 7-day window
  } else {
    // monthly - last 30 days including today
    start.setDate(end.getDate() - 29);
  }
  // normalize to start of day for start, end to end of day
  start.setHours(0,0,0,0);
  end.setHours(23,59,59,999);
  return { startDate: start, endDate: end };
};

const buildDisplayName = (user) => {
  if (!user) return 'User';
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length-1][0]}.`;
  }
  if (user.email) {
    const [local, domain] = user.email.split('@');
    if (local && local.length > 2) return local.slice(0,2) + '***';
    return 'User';
  }
  return 'User';
};

const getSkillScoreInRange = (user, skill, startDate, endDate) => {
  if (!user || !user.skillScores || !Array.isArray(user.skillScores)) return null;
  const normalized = normalizeSkillName(skill);
  const records = user.skillScores.filter(s => String(s.skill || '').toLowerCase().trim() === normalized && s.assessedAt);
  const inRange = records.filter(r => new Date(r.assessedAt) >= startDate && new Date(r.assessedAt) <= endDate);
  if (inRange.length === 0) return null;
  // choose best score in period (max)
  let best = inRange.reduce((acc, cur) => { return (cur.score > acc.score) ? cur : acc; }, inRange[0]);
  return { score: best.score, lastAssessedAt: best.assessedAt };
};

const generateLeaderboardSnapshot = async (period = 'weekly', skill) => {
  const normalizedSkill = normalizeSkillName(skill);
  const { startDate, endDate } = getPeriodRange(period, new Date());

  // Find users who have the skill
  // Escape skill for safe regex (handles names like C++ or C#)
  const safeSkill = escapeRegex(normalizedSkill);
  const users = await User.find({ 'skillScores.skill': { $regex: new RegExp('^' + safeSkill + '$','i') }, isLeaderboardVisible: { $ne: false } }).lean();

  const entries = [];
  for (const user of users) {
    const res = getSkillScoreInRange(user, normalizedSkill, startDate, endDate);
    if (!res) continue;
    const avg = (typeof user.avgSkillScore === 'number' && user.avgSkillScore > 0) ? user.avgSkillScore : calculateAverageSkillScore(user.skillScores || []);
    entries.push({
      userId: user._id,
      displayName: buildDisplayName(user),
      badge: user.badge || { name: 'Beginner', icon: 'bi bi-star' },
      score: res.score,
      lastAssessedAt: res.lastAssessedAt,
      avgSkillScore: avg
    });
  }

  // sort desc by score
  entries.sort((a,b) => (b.score||0) - (a.score||0));
  const top = entries.slice(0,20);

  // compute improvementDelta by fetching previous period snapshot
  // previous period: shift start/end backwards by period length
  const prevNow = new Date();
  if (period === 'weekly') prevNow.setDate(prevNow.getDate() - 7);
  else prevNow.setDate(prevNow.getDate() - 30);
  const prevRange = getPeriodRange(period, prevNow);
  const prevSnapshot = await LeaderboardSnapshot.findOne({ period, skill: normalizedSkill, startDate: prevRange.startDate, endDate: prevRange.endDate }).lean();
  const prevMap = {};
  if (prevSnapshot && Array.isArray(prevSnapshot.entries)) {
    for (const e of prevSnapshot.entries) prevMap[String(e.userId)] = e.score || 0;
  }

  for (const e of top) {
    const prev = prevMap[String(e.userId)] || 0;
    e.improvementDelta = (e.score || 0) - prev;
  }

  // upsert snapshot
  const upsertDoc = await LeaderboardSnapshot.findOneAndUpdate(
    { period, skill: normalizedSkill, startDate, endDate },
    { period, skill: normalizedSkill, startDate, endDate, generatedAt: new Date(), entries: top },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return upsertDoc;
};

const listAvailableSkills = async () => {
  const skills = await User.aggregate([
    { $unwind: '$skillScores' },
    { $group: { _id: { $toLower: { $trim: { input: '$skillScores.skill' } } } } },
    { $project: { skill: '$_id', _id: 0 } }
  ]);
  return skills.map(s => s.skill).filter(Boolean).sort();
};

module.exports = {
  normalizeSkillName,
  getPeriodRange,
  buildDisplayName,
  getSkillScoreInRange,
  generateLeaderboardSnapshot,
  listAvailableSkills
};
