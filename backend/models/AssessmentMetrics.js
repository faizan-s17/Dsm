const mongoose = require("mongoose");

const assessmentMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  assessmentId: {
    type: String,
    required: true,
    unique: true // Each assessment should have a unique ID
  },
  
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  
  // Questions data
  totalQuestions: {
    type: Number,
    required: true
  },
  
  // Time-based metrics
  timeMetrics: {
    totalTime: {
      type: Number, // Total time in seconds
      required: true
    },
    avgTimePerQuestion: {
      type: Number, // Average time per question in seconds
      required: true
    },
    questionTimeSpent: [{
      questionIndex: Number,
      timeSpent: Number // Time spent in milliseconds
    }]
  },
  
  // Confidence metrics
  confidenceMetrics: {
    avgConfidence: {
      type: Number, // Average confidence percentage
      required: true,
      min: 0,
      max: 100
    },
    confidenceFactors: {
      antiCheatImpact: Number, // Impact of anti-cheat violations on confidence
      timePressure: Number, // Impact of time pressure on confidence
      consistency: Number // Consistency of answers
    }
  },
  
  // Anti-cheat metrics
  antiCheatMetrics: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    copyAttempts: {
      type: Number,
      default: 0
    },
    pasteAttempts: {
      type: Number,
      default: 0
    },
    focusLost: {
      type: Number,
      default: 0
    },
    warningLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
    },
    totalViolations: {
      type: Number,
      default: 0
    }
  },
  
  // Focus metrics
  focusScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Assessment details
  assessmentDetails: {
    experienceLevel: String,
    questionType: String, // 'mcq', 'open_ended', 'both'
    skillsAssessed: [String],
    totalScore: Number,
    skillScores: [{
      skill: String,
      score: Number
    }]
  },
  
  // Behavioral metrics
  behavioralMetrics: {
    navigationPattern: [{
      questionIndex: Number,
      timestamp: Date,
      action: String // 'view', 'answer', 'navigate'
    }],
    answerPattern: [{
      questionIndex: Number,
      timeToAnswer: Number, // Time in seconds
      changedAnswers: Number, // Number of times answer was changed
      initialAnswer: String,
      finalAnswer: String
    }],
    pauseEvents: [{
      startTime: Date,
      endTime: Date,
      duration: Number // Duration in seconds
    }]
  },
  
  // Performance indicators
  performanceIndicators: {
    accuracyRate: {
      type: Number,
      min: 0,
      max: 100
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100
    },
    difficultyAdaptation: {
      initialDifficulty: String,
      finalDifficulty: String
    }
  },
  
  // Model training flags
  usedForTraining: {
    type: Boolean,
    default: false
  },
  
  trainingDataQuality: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Additional metadata
  metadata: {
    userAgent: String,
    deviceType: String,
    browser: String,
    os: String,
    ipHash: String // Hashed IP for privacy
  }
  ,
  // Store generated questions (draft) and submitted answers
  generatedQuestions: {
    type: Array,
    default: []
  },
  submittedAnswers: {
    type: Array,
    default: []
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model("AssessmentMetrics", assessmentMetricsSchema);