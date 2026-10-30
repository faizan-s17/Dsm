const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  skills: [{ type: String }],
  skillScores: [{
    skill: String,
    score: Number,
    assessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  avgSkillScore: { type: Number, default: 0 },
  badge: {
    name: { type: String, default: "Beginner" },
    icon: { type: String, default: "bi bi-star" },
    updatedAt: { type: Date, default: Date.now }
  },
    // ✅ selected/ongoing course
  ongoingCourse: {
    courseId: { type: String, default: null },
    title: { type: String, default: "" },
    provider: { type: String, default: "" },
    courseLink: { type: String, default: "" },
    skills: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["none", "ongoing", "completed"],
      default: "none"
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  bio: { type: String, default: "" },
  education: [{
    institution: String,
    degree: String,
    field: String,
    graduationYear: Number
  }],
  experience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    url: String
  }],
  tasks: [{
    title: String,
    description: String,
    deadline: Date,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    }
  }],
  learningPaths: [{
    course: String,
    provider: String,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  recentActivity: [{
    type: { type: String },
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
  ,
  isLeaderboardVisible: {
    type: Boolean,
    default: true
  }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
