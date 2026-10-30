const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job', // Reference to the Job model
    required: true,
  },
  userEmail: {
    type: String, // Email of the candidate applying
    required: true,
  },
  status: {
    type: String, // e.g., "Applied", "Interviewed", "Rejected", etc.
    default: "Applied",
  },
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
