const mongoose = require('mongoose');

const skillReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicId: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  badge: {
    name: String,
    icon: String
  },
  avgSkillScore: { type: Number, default: 0 },
  topSkills: [{ skill: String, score: Number }],
  timeline: [{ date: Date, avgScore: Number }],
  skillScoresSnapshot: [{ skill: String, score: Number, assessedAt: Date }]
});

const SkillReport = mongoose.model('SkillReport', skillReportSchema);
module.exports = SkillReport;
