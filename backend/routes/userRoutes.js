const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { auth, authorize, trackActivity, rateLimit } = require('../middleware/auth');
const User = require('../models/User');
const fs = require('fs');
const { applyBadgeToUser } = require('../utils/badgeUtils');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename using userId and timestamp
    const userId = req.user._id || req.user.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
  }
});

// User registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, skills } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'user',
      skills: Array.isArray(skills) ? skills : [],
      education: [],
      experience: [],
      certifications: [],
      recentActivity: []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Get user profile with data isolation check
router.get('/profile', auth, trackActivity, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Always recalculate badge based on current skill scores to ensure it's up-to-date
    if (user.skillScores && Array.isArray(user.skillScores)) {
      applyBadgeToUser(user);
      await user.save();
    }
    
    console.log(`Fetching profile for user ID: ${userId}`);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Enhanced error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

// Input validation middleware
const validateProfileUpdate = (req, res, next) => {
  const { name, email, skills } = req.body;
  
  if (name && name.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }
  
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  if (skills && !Array.isArray(skills)) {
    return res.status(400).json({ message: 'Skills must be an array' });
  }
  
  next();
};


// Add validation to profile update route
router.put('/profile', auth, validateProfileUpdate, trackActivity, async (req, res) => {
  try {
    const {
      name,
      bio,
      skills,
      education,
      experience,
      certifications
    } = req.body;

    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (skills) user.skills = skills;
    if (education) user.education = education;
    if (experience) user.experience = experience;
    if (certifications) user.certifications = certifications;

    // Add timestamp for profile update
    user.lastUpdated = new Date();

    await user.save();
    res.json({ 
      message: 'Profile updated successfully', 
      user: user.toObject({ getters: true, versionKey: false })
    });
  } catch (error) {
    next(error);
  }
});

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    
    // If user already has a profile picture, delete the old one
    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', 'public', user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    // Store relative path in database
    const relativePath = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = relativePath;
    await user.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: relativePath
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
});

// Get user tasks with data isolation
router.get('/tasks', auth, trackActivity, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select('tasks');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Fetching tasks for user ID: ${userId}`);
    res.json(user.tasks);
  } catch (error) {
    console.error('Tasks fetch error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Add validation to task update route
router.put('/tasks/:taskId', auth, trackActivity, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Not Started', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid task status' });
    }

    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const task = user.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    task.lastUpdated = new Date();
    await user.save();

    res.json({ 
      message: 'Task updated successfully', 
      task: task.toObject({ getters: true })
    });
  } catch (error) {
    next(error);
  }
});
// ✅ Select course (start ongoing course)
router.post("/course/select", auth, async (req, res) => {
  try {
    const { courseId, title, provider, courseLink, skills } = req.body;

    if (!title) return res.status(400).json({ message: "Course title required" });

    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.ongoingCourse = {
      courseId: courseId || null,
      title,
      provider: provider || "",
      courseLink: courseLink || "",
      skills: Array.isArray(skills) ? skills : [],
      status: "ongoing",
      startedAt: new Date(),
      completedAt: null
    };

    // optional: activity
    user.recentActivity.unshift({
      type: "course",
      description: `Started course: ${title}`,
      date: new Date()
    });
    user.recentActivity = user.recentActivity.slice(0, 10);

    await user.save();
    res.json({ success: true, ongoingCourse: user.ongoingCourse });
  } catch (error) {
    console.error("Course select error:", error);
    res.status(500).json({ message: "Error selecting course" });
  }
});

// ✅ Complete course
router.post("/course/complete", auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.ongoingCourse || user.ongoingCourse.status !== "ongoing") {
      return res.status(400).json({ message: "No ongoing course to complete" });
    }

    user.ongoingCourse.status = "completed";
    user.ongoingCourse.completedAt = new Date();

    // optional: activity
    user.recentActivity.unshift({
      type: "course",
      description: `Completed course: ${user.ongoingCourse.title}`,
      date: new Date()
    });
    user.recentActivity = user.recentActivity.slice(0, 10);

    await user.save();
    res.json({ success: true, ongoingCourse: user.ongoingCourse });
  } catch (error) {
    console.error("Course complete error:", error);
    res.status(500).json({ message: "Error completing course" });
  }
});


// Get user learning paths with data isolation
router.get('/learning-paths', auth, trackActivity, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select('learningPaths');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Fetching learning paths for user ID: ${userId}`);
    res.json(user.learningPaths);
  } catch (error) {
    console.error('Learning paths fetch error:', error);
    res.status(500).json({ message: 'Error fetching learning paths' });
  }
});

// Add validation to learning path update route
router.put('/learning-paths/:pathId', auth, trackActivity, async (req, res) => {
  try {
    const { progress } = req.body;
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be a number between 0 and 100' });
    }

    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const path = user.learningPaths.id(req.params.pathId);
    if (!path) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    path.progress = progress;
    path.lastUpdated = new Date();
    await user.save();

    res.json({ 
      message: 'Learning path updated successfully', 
      path: path.toObject({ getters: true })
    });
  } catch (error) {
    next(error);
  }
});

// Logout (invalidate token)
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId);
    
    // Add current token to invalidated tokens list
    if (!user.invalidatedTokens) {
      user.invalidatedTokens = [];
    }
    user.invalidatedTokens.push(req.token);
    
    await user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Error logging out' });
  }
});

// Use error handling middleware
router.use(errorHandler);

module.exports = router; 

