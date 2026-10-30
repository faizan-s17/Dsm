const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: null
  },
  logo: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  industry: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  phoneNumber: {
    type: String,
    default: null
  },
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  foundedYear: {
    type: Number,
    default: null
  },
  socialMedia: {
    linkedin: { type: String, default: null },
    twitter: { type: String, default: null },
    facebook: { type: String, default: null },
    instagram: { type: String, default: null }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for jobs posted by this company
companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'company'
});

module.exports = mongoose.model('Company', companySchema);
