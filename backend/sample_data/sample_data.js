const mongoose = require('mongoose');
const Job = require('../models/Job');
const Course = require('../models/courses');
const Company = require('../models/Company');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample course data
const sampleCourses = [
  {
    title: 'Advanced JavaScript Programming',
    description: 'Learn modern JavaScript concepts including ES6+, async/await, closures, and functional programming. Master the language that powers the web.',
    category: 'Udemy',
    duration: '20 hours',
    thumbnail: '/course-images/javascript.jpg',
    courseLink: 'https://www.udemy.com/course/advanced-javascript-concepts/',
    skills: ['JavaScript', 'Web Development', 'Frontend']
  },
  {
    title: 'React.js Complete Developer Course',
    description: 'Become a React professional. Learn hooks, context API, Redux, and building advanced React applications with best practices.',
    category: 'Coursera',
    duration: '30 hours',
    thumbnail: '/course-images/react.jpg',
    courseLink: 'https://www.coursera.org/learn/react',
    skills: ['React', 'JavaScript', 'Frontend']
  },
  {
    title: 'Python for Data Science and Machine Learning',
    description: 'Comprehensive course covering Python libraries like NumPy, Pandas, Scikit-Learn, and TensorFlow for data analysis and machine learning.',
    category: 'edX',
    duration: '40 hours',
    thumbnail: '/course-images/python-ds.jpg',
    courseLink: 'https://www.edx.org/learn/python-data-science',
    skills: ['Python', 'Data Science', 'Machine Learning']
  },
  {
    title: 'Full Stack Web Development Bootcamp',
    description: 'Learn end-to-end web development with MongoDB, Express, React, and Node.js (MERN stack).',
    category: 'Udacity',
    duration: '60 hours',
    thumbnail: '/course-images/full-stack.jpg',
    courseLink: 'https://www.udacity.com/course/full-stack-web-developer-nanodegree--nd0044',
    skills: ['MongoDB', 'Express', 'React', 'Node.js', 'Full Stack']
  },
  {
    title: 'UX/UI Design Fundamentals',
    description: 'Master user experience and interface design principles. Learn user research, wireframing, prototyping and design systems.',
    category: 'LinkedIn Learning',
    duration: '15 hours',
    thumbnail: '/course-images/uxui.jpg',
    courseLink: 'https://www.linkedin.com/learning/ux-design-1-overview',
    skills: ['UI/UX', 'Web Design', 'Figma']
  },
  {
    title: 'AWS Certified Solutions Architect',
    description: 'Prepare for the AWS Solutions Architect certification with hands-on labs and real-world scenarios.',
    category: 'A Cloud Guru',
    duration: '35 hours',
    thumbnail: '/course-images/aws.jpg',
    courseLink: 'https://acloudguru.com/course/aws-certified-solutions-architect-associate',
    skills: ['AWS', 'Cloud Computing', 'DevOps']
  },
  {
    title: 'iOS App Development with Swift',
    description: 'Build iOS applications using Swift, UIKit, and SwiftUI. Learn best practices for Apple\'s ecosystem.',
    category: 'Pluralsight',
    duration: '25 hours',
    thumbnail: '/course-images/swift.jpg',
    courseLink: 'https://www.pluralsight.com/paths/ios',
    skills: ['iOS', 'Swift', 'Mobile Development']
  },
  {
    title: 'Data Structures and Algorithms Masterclass',
    description: 'Comprehensive coverage of data structures, algorithms, and problem-solving techniques for coding interviews.',
    category: 'Udemy',
    duration: '50 hours',
    thumbnail: '/course-images/dsa.jpg',
    courseLink: 'https://www.udemy.com/course/js-algorithms-and-data-structures-masterclass/',
    skills: ['Algorithms', 'Data Structures', 'Problem Solving']
  }
];

// Sample job data
const sampleJobs = [
  {
    jobTitle: 'Frontend Developer',
    jobDescription: 'We are looking for an experienced Frontend Developer proficient in React.js to join our team. You will be responsible for building user interfaces, implementing responsive designs, and optimizing web performance.',
    companyEmail: 'careers@techcompany.com',
    companyName: 'Tech Solutions Inc.',
    skills: ['JavaScript', 'React', 'HTML', 'CSS'],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'active',
    verified: true
  },
  {
    jobTitle: 'Backend Developer',
    jobDescription: 'Seeking a Backend Developer with experience in Node.js and Express. You will develop APIs, integrate with databases, and maintain server infrastructure.',
    companyEmail: 'jobs@webtech.com',
    companyName: 'WebTech Systems',
    skills: ['Node.js', 'Express', 'MongoDB', 'API Development'],
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    status: 'active',
    verified: true
  },
  {
    jobTitle: 'Full Stack Developer',
    jobDescription: 'Join our team as a Full Stack Developer working with the MERN stack. You will be involved in all aspects of development from database design to frontend implementation.',
    companyEmail: 'careers@fullstack.io',
    companyName: 'FullStack Solutions',
    skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Full Stack'],
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    status: 'active',
    verified: true
  },
  {
    jobTitle: 'UI/UX Designer',
    jobDescription: 'Looking for a talented UI/UX Designer to create beautiful, intuitive interfaces for our products. Experience with Figma and user research is required.',
    companyEmail: 'design@creativeco.com',
    companyName: 'Creative Co.',
    skills: ['UI/UX', 'Figma', 'Web Design', 'User Research'],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'active',
    verified: true
  },
  {
    jobTitle: 'Data Scientist',
    jobDescription: 'We need a Data Scientist with expertise in Python and machine learning to analyze data and build predictive models for our business intelligence team.',
    companyEmail: 'hiring@datainsights.com',
    companyName: 'Data Insights Inc.',
    skills: ['Python', 'Machine Learning', 'Data Science', 'Statistical Analysis'],
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    status: 'active',
    verified: true
  },
  {
    jobTitle: 'DevOps Engineer',
    jobDescription: 'Join us as a DevOps Engineer to build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure system reliability and scalability.',
    companyEmail: 'tech@cloudops.com',
    companyName: 'CloudOps Technologies',
    skills: ['AWS', 'DevOps', 'Docker', 'Kubernetes'],
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    status: 'active',
    verified: true
  }
];

// Create sample companies
const createSampleCompanies = async () => {
  try {
    // First check if companies already exist to avoid duplicates
    const existingCompanies = await Company.find();
    if (existingCompanies.length > 0) {
      console.log('Companies already exist in the database');
      return existingCompanies;
    }

    const sampleCompanies = [
      {
        companyName: 'Tech Solutions Inc.',
        name: 'Tech Solutions',
        email: 'admin@techcompany.com',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '123 Tech Park, San Francisco, CA',
        location: 'San Francisco',
        industry: 'Technology',
        description: 'Leading technology solutions provider',
        isVerified: true,
        status: 'active'
      },
      {
        companyName: 'WebTech Systems',
        name: 'WebTech',
        email: 'admin@webtech.com',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '456 Web Avenue, New York, NY',
        location: 'New York',
        industry: 'Web Development',
        description: 'Specializing in web technologies and applications',
        isVerified: true,
        status: 'active'
      },
      {
        companyName: 'FullStack Solutions',
        name: 'FullStack',
        email: 'admin@fullstack.io',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '789 Stack Street, Austin, TX',
        location: 'Austin',
        industry: 'Software Development',
        description: 'Full stack development services',
        isVerified: true,
        status: 'active'
      },
      {
        companyName: 'Creative Co.',
        name: 'Creative',
        email: 'admin@creativeco.com',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '101 Design Boulevard, Portland, OR',
        location: 'Portland',
        industry: 'Design',
        description: 'Creative design solutions for digital products',
        isVerified: true,
        status: 'active'
      },
      {
        companyName: 'Data Insights Inc.',
        name: 'Data Insights',
        email: 'admin@datainsights.com',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '202 Analytics Drive, Boston, MA',
        location: 'Boston',
        industry: 'Data Science',
        description: 'Data analytics and business intelligence',
        isVerified: true,
        status: 'active'
      },
      {
        companyName: 'CloudOps Technologies',
        name: 'CloudOps',
        email: 'admin@cloudops.com',
        password: '$2b$10$B8EDv1iYSO5YYUEqXqV7Q.wjjRrKvbALQMEnZ96Aj288BwXQWc5Vy', // hashed "password123"
        address: '303 Cloud Street, Seattle, WA',
        location: 'Seattle',
        industry: 'Cloud Services',
        description: 'Cloud infrastructure and operations',
        isVerified: true,
        status: 'active'
      }
    ];

    const insertedCompanies = await Company.insertMany(sampleCompanies);
    console.log(`Inserted ${insertedCompanies.length} sample companies`);
    return insertedCompanies;
  } catch (error) {
    console.error('Error creating sample companies:', error);
    throw error;
  }
};

// Function to insert sample course data
const insertSampleCourses = async () => {
  try {
    // First check if courses already exist to avoid duplicates
    const existingCourses = await Course.find();
    if (existingCourses.length > 0) {
      console.log('Courses already exist in the database, skipping insertion');
      return;
    }

    // Insert the sample courses
    const insertedCourses = await Course.insertMany(sampleCourses);
    console.log(`Inserted ${insertedCourses.length} sample courses`);
  } catch (error) {
    console.error('Error inserting sample courses:', error);
  }
};

// Function to insert sample job data
const insertSampleJobs = async (companies) => {
  try {
    // First check if jobs already exist to avoid duplicates
    const existingJobs = await Job.find();
    if (existingJobs.length > 0) {
      console.log('Jobs already exist in the database, skipping insertion');
      return;
    }

    // Get company IDs to associate with jobs
    const companyMap = companies.reduce((map, company) => {
      map[company.companyName] = company._id;
      return map;
    }, {});

    // Add company IDs to job data
    const jobsWithCompanies = sampleJobs.map(job => ({
      ...job,
      company: companyMap[job.companyName] || companies[0]._id // Default to first company if not found
    }));

    // Insert the sample jobs
    const insertedJobs = await Job.insertMany(jobsWithCompanies);
    console.log(`Inserted ${insertedJobs.length} sample jobs`);
  } catch (error) {
    console.error('Error inserting sample jobs:', error);
  }
};

// Main function to run the data insertion
const seedDatabase = async () => {
  try {
    await connectDB();
    const companies = await createSampleCompanies();
    await insertSampleCourses();
    await insertSampleJobs(companies);
    console.log('Sample data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 