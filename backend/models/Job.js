const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  companyEmail: {
    type: String,  // Storing the email of the company posting the job
    required: true,
  },
  companyName: {
    type: String,  // Storing the name of the company posting the job
    required: true,  // This can be made optional if needed
  },
  skills: {
    type: [String],
    required: true,
    default: []
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'filled', 'draft'],
    default: 'active'
  },
  verified: {
    type: Boolean,
    default: false
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  applicants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
