const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  displayName: String,
  badge: { name: String, icon: String },
  score: Number,
  lastAssessedAt: Date,
  avgSkillScore: Number,
  improvementDelta: Number
}, { _id: false });

const leaderboardSnapshotSchema = new mongoose.Schema({
  period: { type: String, enum: ['weekly','monthly'], required: true },
  skill: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  entries: [entrySchema]
});

leaderboardSnapshotSchema.index({ period: 1, skill: 1, startDate: 1, endDate: 1 }, { unique: true });

const LeaderboardSnapshot = mongoose.model('LeaderboardSnapshot', leaderboardSnapshotSchema);
module.exports = LeaderboardSnapshot;
