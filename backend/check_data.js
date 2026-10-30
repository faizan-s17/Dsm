const mongoose = require('mongoose');
const Job = require('./models/Job');
const Course = require('./models/courses');
const Company = require('./models/Company');
require('dotenv').config();

const checkDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Check counts
    const companiesCount = await Company.countDocuments();
    console.log(`Number of companies in database: ${companiesCount}`);

    const coursesCount = await Course.countDocuments();
    console.log(`Number of courses in database: ${coursesCount}`);

    const jobsCount = await Job.countDocuments();
    console.log(`Number of jobs in database: ${jobsCount}`);

    // Get a sample of each for verification
    if (coursesCount > 0) {
      const sampleCourses = await Course.find().limit(3);
      console.log('\nSample courses:');
      sampleCourses.forEach(course => {
        console.log(`- ${course.title} (${course.skills.join(', ')})`);
      });
    }

    if (jobsCount > 0) {
      const sampleJobs = await Job.find().limit(3);
      console.log('\nSample jobs:');
      sampleJobs.forEach(job => {
        console.log(`- ${job.jobTitle} (${job.companyName})`);
      });
    }

    mongoose.disconnect();
    console.log('Database check complete');
  } catch (error) {
    console.error('Error checking database:', error);
  }
};

checkDatabase(); 