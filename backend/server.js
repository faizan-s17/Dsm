const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const Company = require("./models/Company");
const User = require("./models/User");
const nodemailer = require("nodemailer");
const OTP = require("./models/OTP");
const Job = require("./models/Job");
const Admin = require('./models/Admin');
const Course = require('./models/courses');
const { body, validationResult } = require("express-validator"); // Add this to use validation for user routes
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const userRoutes = require('./routes/userRoutes');
const skillAssessmentRoutes = require('./routes/skillAssessmentRoutes');
const skillPracticeRoutes = require('./routes/skillPracticeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { spawn } = require('child_process');
const { applyBadgeToUser } = require('./utils/badgeUtils');


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Configure allowed origins from env or sensible defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
  maxAge: 600
};

// Apply CORS and body parsing early so routes see parsed bodies
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Update this if using another email service
  auth: {
    user: process.env.EMAIL, // Sender's email
    pass: process.env.EMAIL_PASSWORD, // Sender's password
  },
});

// Reusable email template helpers

const buildEmailLayout = ({ title, subtitle, contentHtml, accentColor, footerNote }) => {
  const mainBg = '#0b0f14';
  const cardBg = '#111827';
  const textColor = '#ffffff';
  const mutedTextColor = '#cbd5e1';
  
  return `<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">
<html data-editor-version=\"2\" class=\"sg-campaigns\" xmlns=\"http://www.w3.org/1999/xhtml\">
<head>
  <meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1\">
  <!--[if !mso]><!-->
  <meta http-equiv=\"X-UA-Compatible\" content=\"IE=Edge\">
  <!--<![endif]-->
  <!--[if (gte mso 9)|(IE)]>
  <xml>
  <o:OfficeDocumentSettings>
  <o:AllowPNG/>
  <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <!--[if (gte mso 9)|(IE)]>
  <style type=\"text/css\">
  body {width: 600px;margin: 0 auto;}
  table {border-collapse: collapse;}
  td {border-collapse: collapse;}
  </style>
  <![endif]-->
  <style type=\"text/css\">
    /* CLIENT-SPECIFIC STYLES */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    /* RESET STYLES */
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    /* iOS BLUE LINKS */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* MOBILE STYLES */
    @media screen and (max-width: 600px) {
      .img-responsive { width: 100% !important; height: auto !important; }
      .container { width: 95% !important; }
      .mobile-hide { display: none !important; }
    }
  </style>
</head>
<body style=\"margin: 0 !important; padding: 0 !important; background-color: ${mainBg};\">
  <!-- HIDDEN PREHEADER TEXT -->
  <div style=\"display: none; font-size: 1px; color: ${mainBg}; line-height: 1px; font-family: Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;\">
    ${subtitle}
  </div>
  
  <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: ${mainBg};\">
    <tr>
      <td align=\"center\" valign=\"top\">
        <!--[if (gte mso 9)|(IE)]>
        <table align=\"center\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\" width=\"600\">
        <tr>
        <td align=\"center\" valign=\"top\" width=\"600\">
        <![endif]-->
        <table bgcolor=\"${cardBg}\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 600px; border-radius: 12px; margin: 20px 0;\">
          <!-- LOGO SECTION -->
          <tr>
            <td align=\"center\" valign=\"top\" style=\"padding: 30px 20px 20px;\">
              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
                <tr>
                  <td align=\"center\" style=\"color: ${textColor}; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; letter-spacing: -0.5px; line-height: 32px;\">
                    DSM Portal
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- HEADER SECTION -->
          <tr>
            <td align=\"center\" valign=\"top\" style=\"padding: 0 40px 20px;\">
              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
                <tr>
                  <td align=\"center\" style=\"color: ${textColor}; font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; letter-spacing: -0.5px; line-height: 32px;\">
                    ${title}
                  </td>
                </tr>
                <tr>
                  <td align=\"center\" style=\"padding: 15px 0 0; color: ${mutedTextColor}; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px;\">
                    ${subtitle}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CONTENT SECTION -->
          <tr>
            <td align=\"center\" valign=\"top\" style=\"padding: 0 40px 30px;\">
              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
                <tr>
                  <td align=\"left\" style=\"color: ${mutedTextColor}; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px;\">
                    ${contentHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- FOOTER SECTION -->
          <tr>
            <td align=\"center\" valign=\"top\" style=\"padding: 30px 40px 30px; border-top: 1px solid #2D3748;\">
              <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">
                <tr>
                  <td align=\"center\" style=\"color: ${mutedTextColor}; font-family: Arial, sans-serif; font-size: 14px; line-height: 20px;\">
                    ${footerNote}
                  </td>
                </tr>
                <tr>
                  <td align=\"center\" style=\"padding: 15px 0 0; color: ${mutedTextColor}; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px;\">
                    © 2025 Dynamic Skill Matching Portal. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildOtpEmail = ({ name, otp, purpose, accentColor }) => {
  const contentHtml = `
    <p>Hello ${name || 'there'},</p>
    <p>${purpose}</p>
    
    <div style=\"text-align: center; margin: 30px 0;\">
      <div style=\"display: inline-block; padding: 15px 30px; background-color: #1E293B; border: 2px solid ${accentColor}; border-radius: 8px; font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: ${accentColor};\">
        ${otp}
      </div>
    </div>
    
    <p><strong>This code expires in 10 minutes.</strong></p>
    <p style=\"color: #9CA3AF;\">Security Note: If you didn't request this, please ignore this email.</p>
  `;
  
  return buildEmailLayout({
    title: purpose.includes('reset') ? 'Password Reset' : 'Account Verification',
    subtitle: purpose,
    contentHtml,
    accentColor,
    footerNote: 'Need help? Contact support@dsmpotal.com<br>Dynamic Skill Matching Portal'
  });
};

const buildJobOfferEmail = ({ userName, jobTitle, companyName, location, salary, applyUrl }) => {
  const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const finalApplyUrl = applyUrl || `${fallbackUrl}/job-offers`;
  const accentColor = '#3B82F6';
  
  const contentHtml = `
    <p>Hello ${userName || 'there'},</p>
    <p>We're excited to offer you the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
    
    <table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin: 20px 0; border-collapse: collapse;\">
      <tr>
        <td style=\"padding: 12px; border-bottom: 1px solid #2D3748; color: ${accentColor}; font-weight: bold;\">Position Details</td>
      </tr>
      <tr>
        <td style=\"padding: 12px 0;\">
          <div><strong>Job Title:</strong> ${jobTitle}</div>
          <div><strong>Company:</strong> ${companyName}</div>
          <div><strong>Location:</strong> ${location || 'Not specified'}</div>
          <div><strong>Salary:</strong> ${salary || 'Competitive'}</div>
        </td>
      </tr>
    </table>
    
    <p>Please review the offer and let us know if you have any questions.</p>
    
    <div style=\"text-align: center; margin: 30px 0;\">
      <a href=\"${finalApplyUrl}\" target=\"_blank\" style=\"display: inline-block; padding: 15px 30px; background-color: ${accentColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; text-align: center; letter-spacing: 0.5px;\">
        View Job Offer
      </a>
    </div>
    
    <p style=\"color: #9CA3AF;\">Security Note: If you weren't expecting this offer, please contact the sender directly to confirm authenticity.</p>
  `;
  
  return buildEmailLayout({
    title: 'Job Offer',
    subtitle: `Congratulations! You've received a job offer`,
    contentHtml,
    accentColor: '#3B82F6',
    footerNote: 'Need help? Contact support@dsmpotal.com<br>Dynamic Skill Matching Portal'
  });
};

// Assessment evaluate endpoint - runs Python CLI to evaluate answers
// Ensure preflight for this route is handled with configured options
app.options('/api/assessment/evaluate', cors(corsOptions));
// Assessment evaluate endpoint - runs Python CLI to evaluate answers
app.post('/api/assessment/evaluate', async (req, res) => {
  try {
    // Defensive CORS headers: echo back origin when allowed
    const reqOrigin = req.headers.origin;
    if (!reqOrigin || allowedOrigins.indexOf(reqOrigin) !== -1) {
      if (reqOrigin) res.header('Access-Control-Allow-Origin', reqOrigin);
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    const { questions, answers, experienceLevel } = req.body || {};

    // Debug logging to help diagnose client payload shape
    console.log('/api/assessment/evaluate headers:', req.headers);
    console.log('/api/assessment/evaluate payload types before coercion:', {
      questionsType: Array.isArray(questions) ? 'array' : typeof questions,
      answersType: Array.isArray(answers) ? 'array' : typeof answers,
      rawBodyType: typeof req.body
    });

    // Coerce objects with numeric keys or JSON strings into arrays (defensive)
    const coerceToArray = (val) => {
      if (Array.isArray(val)) return val;
      if (!val) return null;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
          val = parsed;
        } catch (e) {
          // not JSON
        }
      }
      if (typeof val === 'object') {
        // If object has numeric keys 0..n-1, convert to array
        const keys = Object.keys(val);
        const numeric = keys.every(k => String(parseInt(k, 10)) === k);
        if (numeric) {
          return keys
            .map(k => ({k: parseInt(k,10), v: val[k]}))
            .sort((a,b) => a.k - b.k)
            .map(x => x.v);
        }
        // If it's an object with other structure, cannot coerce
      }
      return null;
    };

    const qArr = coerceToArray(questions);
    const aArr = coerceToArray(answers);

    console.log('/api/assessment/evaluate payload types after coercion:', {
      questionsType: qArr ? 'array' : typeof questions,
      answersType: aArr ? 'array' : typeof answers
    });

    if (!Array.isArray(qArr) || !Array.isArray(aArr)) {
      return res.status(400).json({ error: 'questions and answers must be arrays' });
    }

    // Use coerced arrays
    const questionsArr = qArr;
    const answersArr = aArr;
    if (questions.length !== answers.length) {
      return res.status(400).json({ error: 'questions and answers must have the same length' });
    }

    const argObj = {
      command: 'evaluate_answers',
      questions: questionsArr,
      answers: answersArr,
      user_level: experienceLevel || 'Intermediate'
    };

    const scriptPath = path.join(__dirname, 'skill_assessment.py');
    const argStr = JSON.stringify(argObj);

    const py = spawn('python', [scriptPath, argStr], { windowsHide: true });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error('[skill_assessment.py stderr]', data.toString());
    });

    py.on('close', (code) => {
      if (stderr && !stdout) {
        return res.status(500).json({ error: 'Error evaluating answers', details: stderr.slice(0, 2000) });
      }
      try {
        const parsed = JSON.parse(stdout);
        return res.json(parsed);
      } catch (e) {
        console.error('Failed to parse Python evaluation output as JSON', e, 'stdout:', stdout);
        return res.status(500).json({ error: 'Invalid response from evaluator' });
      }
    });

    py.on('error', (err) => {
      console.error('Failed to start Python evaluation process', err);
      return res.status(500).json({ error: 'Failed to start evaluator process' });
    });

  } catch (err) {
    console.error('Error in /api/assessment/evaluate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
app.use(limiter);

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60 // Session TTL (1 day)
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
};

// Apply session middleware
app.use(session(sessionConfig));

// Use dynamic CORS options (configured earlier)
app.use(cors(corsOptions));

// Enable pre-flight requests for all routes using the same options
app.options('*', cors(corsOptions));

// Accept JSON and URL-encoded bodies (robust parsing)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Assessment generate endpoint - runs Python CLI to produce questions
app.post('/api/assessment/generate', async (req, res) => {
  try {
    const { skills, questionType, experienceLevel, jobDescription } = req.body || {};

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'skills must be a non-empty array' });
    }

    // Map incoming questionType to python expected question_types list
    let question_types = ['mcq', 'open_ended'];
    if (typeof questionType === 'string') {
      const qt = questionType.toLowerCase();
      if (qt === 'mcq') question_types = ['mcq'];
      else if (qt === 'open_ended' || qt === 'open-ended') question_types = ['open_ended'];
      else if (qt === 'both') question_types = ['mcq', 'open_ended'];
    }

    const argObj = {
      command: 'generate_questions',
      skills: skills,
      question_types: question_types,
      job_description: jobDescription || null,
      experienceLevel: experienceLevel || null
    };

    const scriptPath = path.join(__dirname, 'skill_assessment.py');
    const argStr = JSON.stringify(argObj);

    const py = spawn('python', [scriptPath, argStr], { windowsHide: true });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    py.stderr.on('data', (data) => {
      stderr += data.toString();
      // Log stderr safely
      console.error('[skill_assessment.py stderr]', data.toString());
    });

    py.on('close', (code) => {
      if (stderr && !stdout) {
        // If Python logged errors but produced no stdout, return 500
        return res.status(500).json({ error: 'Error generating questions', details: stderr.slice(0, 2000) });
      }

      try {
        const parsed = JSON.parse(stdout);
        return res.json(parsed);
      } catch (e) {
        console.error('Failed to parse Python output as JSON', e, 'stdout:', stdout);
        return res.status(500).json({ error: 'Invalid response from generator' });
      }
    });

    py.on('error', (err) => {
      console.error('Failed to start Python process', err);
      return res.status(500).json({ error: 'Failed to start generator process' });
    });

  } catch (err) {
    console.error('Error in /api/assessment/generate', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to check the token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please log in again.' });
    }

    // Verify token and decode user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add timestamp verification
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }

    // Store decoded user info in request object
    req.user = decoded;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    } else {
      return res.status(401).json({ message: 'Authentication error. Please log in again.' });
    }
  }
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
const profilePicturesDir = path.join(uploadDir, 'profile-pictures');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(profilePicturesDir)) {
  fs.mkdirSync(profilePicturesDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Routes
// Register Company with OTP
app.post('/api/company/register', async (req, res) => {
  const { email } = req.body;

  try {
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    await OTP.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: 'Your OTP for Company Registration',
      html: buildOtpEmail({
        name: '',
        otp: otp,
        purpose: 'Thank you for registering your company with our platform. Use the OTP below to complete your registration.',
        accentColor: '#10B981' // Emerald color for registration
      })
    });

    res.status(200).json({ message: 'OTP sent to email. Please verify to complete registration.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Verify OTP and Register Company
app.post("/api/company/verify-otp", async (req, res) => {
  const { email, otp, companyName, password, address } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newCompany = new Company({
      companyName,
      email,
      password: hashedPassword,
      address,
    });

    await newCompany.save();
    await OTP.deleteOne({ email });

    res
      .status(200)
      .json({ message: "Email verified and company registered successfully!" });
  } catch (error) {
    console.error("Error during OTP verification:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Login Company
app.post("/api/company/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(email,password);
  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res
        .status(400)
        .json({ message: "Invalid Email. User not found." });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password." });
    }

    const token = jwt.sign(
      { 
        id: company._id,
        email: company.email, 
        companyName: company.companyName,
        role: 'company'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      companyName: company.companyName,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ message: "Server error while logging in." });
  }
});

// Post Job Route
app.post("/api/jobs", verifyToken, async (req, res) => {
  try {
    const { jobTitle, jobDescription, companyEmail, companyName, skills, expiryDate } = req.body;
    
    // Validate required fields
    if (!jobTitle || !jobDescription || !companyEmail || !companyName || !skills || !expiryDate) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Validate skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: "At least one skill is required" });
    }
    
    // Validate expiry date
    const today = new Date();
    const expiry = new Date(expiryDate);
    if (expiry <= today) {
      return res.status(400).json({ message: "Expiry date must be in the future" });
    }
    
    // Get company ID from token
    const companyId = req.user.id;
    
    // Create a new job
    const newJob = new Job({
      jobTitle,
      jobDescription,
      companyEmail,
      companyName,
      skills,
      expiryDate: expiry,
      company: companyId,
      status: 'active',
      verified: false
    });
    
    // Save the job to the database
    const savedJob = await newJob.save();
    
    res.status(201).json({
      message: "Job posted successfully",
      job: savedJob
    });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update the get jobs route for companies
app.get("/api/company/get-jobs", verifyToken, async (req, res) => {
  try {
    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: "Unauthorized. Company access required." });
    }
    
    // Get company ID from token
    const companyId = req.user.id;
    
    // Find all jobs associated with this company
    const jobs = await Job.find({ company: companyId })
      .sort({ createdAt: -1 })
      .populate('applicants', 'name email'); // Populate basic applicant info
    
    if (!jobs) {
      return res.status(404).json({ message: "No jobs found for this company" });
    }
    
    res.status(200).json({
      message: "Jobs retrieved successfully",
      jobs: jobs
    });
  } catch (error) {
    console.error("Error retrieving company jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Forgot Password - Generate OTP and Send Email
app.post("/api/company/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: buildOtpEmail({
        name: '',
        otp: otp,
        purpose: 'You have requested to reset your company password. Use the OTP below to complete the process.',
        accentColor: '#F59E0B' // Amber color for password reset
      })
    });

    res.status(200).json({ message: "OTP sent to your email!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Reset Password - Using OTP to reset password
app.post("/api/company/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the company's password
    await Company.updateOne({ email }, { $set: { password: hashedPassword } });

    // Delete OTP after password reset
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
});

// ** Users API **

// ** User Registration - Generate OTP **
app.post(
  "/api/user/register",
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await OTP.findOneAndUpdate(
        { email },
        { otp, expiresAt },
        { upsert: true, new: true }
      );

      await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP for Registration",
        html: buildOtpEmail({
          name: '',
          otp: otp,
          purpose: 'Thank you for registering with our platform. Use the OTP below to complete your registration.',
          accentColor: '#10B981' // Emerald color for registration
        })
      });

      res.status(200).json({ message: "OTP sent to email." });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

app.post("/api/user/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid Email. User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password." });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, role: 'user' },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res
      .status(200)
      .json({ message: "Login successful", token, name: user.name });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// ** Verify OTP and Create User **
app.post("/api/user/verify-otp", async (req, res) => {
  const { email, otp, name, password, skills } = req.body;

  console.log("Request received:", req.body); // Log request payload for debugging

  // Validate required fields
  if (!email || !otp || !name || !password) {
    const missingFields = [];
    if (!email) missingFields.push("email");
    if (!otp) missingFields.push("otp");
    if (!name) missingFields.push("name");
    if (!password) missingFields.push("password");

    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(", ")}.`,
    });
  }

  try {
    // Find OTP entry in the database for the provided email
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    // Check if OTP has expired
    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Check if OTP matches
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    // Hash the user's password asynchronously (better for performance)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Process skills if provided
    const userSkills = Array.isArray(skills) ? skills : [];

    // Create a new user with the provided details
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      skills: userSkills
    });

    // Save the new user to the database
    await newUser.save();
    console.log("New user created:", newUser._id.toString());

    // Delete the OTP entry after successful registration
    await OTP.deleteOne({ email });

    // Generate JWT token for the new user
    const token = jwt.sign(
      { 
        userId: newUser._id.toString(), // Ensure ID is a string
        email: newUser.email, 
        role: 'user',
        name: newUser.name
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '24h' }
    );

    console.log("Generated token with userId:", newUser._id.toString());

    // Send response after successful user registration with token
    res
      .status(200)
      .json({
        message: "Email verified and user registered successfully!",
        token,
        userId: newUser._id.toString(),
        userName: newUser.name
      });
  } catch (error) {
    // Log error for debugging purposes
    console.error("Error during OTP verification:", error.message);
    console.error("Stack trace:", error.stack);

    // Send generic error message to user to prevent leakage of sensitive information
    res
      .status(500)
      .json({ message: "An error occurred during OTP verification." });
  }
});

// ** Google Login API **
app.post("/api/company/google-login", async (req, res) => {
  // This route requires google-auth-library which is not installed
  // To use this route, install the library with: npm install google-auth-library
  return res.status(501).json({ 
    message: "Google login is currently unavailable. Please use email/password login." 
  });
  
  /* Original implementation:
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({ message: "Token not provided." });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("Payload:", payload);

    const { email, name } = payload;

    let company = await Company.findOne({ email });
    if (!company) {
      company = await Company.create({ email, name });
    }

    const jwtToken = jwt.sign(
      { 
        id: company._id,
        email: company.email, 
        companyName: company.companyName || name,
        role: 'company'
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token: jwtToken,
      name: company.name || company.companyName,
    });
  } catch (error) {
    console.error("Google Login Error:", error.message || error);
    res.status(500).json({ message: "Google Login failed. Please try again." });
  }
  */
});

// Get All Users API
app.get("/api/user/get-all-users", async (req, res) => {
  try {
    // Fetch all users from the User collection
    const users = await User.find();

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    // Return the list of users with skill scores and badges
      // Enrich users with latest active report publicId when available
      const SkillReport = require('./models/SkillReport');
      const enriched = await Promise.all(users.map(async (user) => {
        if (user.skillScores && Array.isArray(user.skillScores)) {
          applyBadgeToUser(user);
        }
        const latestReport = await SkillReport.findOne({ userId: user._id, isActive: true }).sort({ createdAt: -1 }).lean();
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          skills: user.skills,
          skillScores: user.skillScores,
          avgSkillScore: user.avgSkillScore,
          badge: user.badge,
          profilePicture: user.profilePicture,
          bio: user.bio,
          education: user.education,
          experience: user.experience,
          certifications: user.certifications,
          createdAt: user.createdAt,
          latestReportPublicId: latestReport ? latestReport.publicId : null
        };
      }));

      res.status(200).json({ users: enriched });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error while fetching users." });
  }
});

// Get Company Stats (e.g., number of jobs posted and available users)
app.get("/api/company/stats", async (req, res) => {
  try {
    // Get the total number of jobs posted by the company
    const jobCount = await Job.countDocuments();

    // Get the total number of registered users (not specific to a company)
    const userCount = await User.countDocuments(); // Count of all users in the system

    // You can also add other statistics here if needed (e.g., active job postings, etc.)
    const stats = {
      jobCount,
      userCount,
      // Add any additional metrics you'd like here
    };

    res
      .status(200)
      .json({ message: "Company stats fetched successfully.", stats });
  } catch (error) {
    console.error("Error fetching company stats:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching company stats." });
  }
});

// Send job offer email
app.post("/api/send-job-offer", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email address is required." });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Job Offer from Our Company",
    html: buildJobOfferEmail({
      userName: '',
      jobTitle: 'Selected Position',
      companyName: 'Our Company',
      location: 'Remote',
      salary: 'Competitive',
      applyUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    })
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, message: "Error sending email." });
  }
});

// Forgot Password - Generate OTP and Send Email
app.post("/api/user/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: buildOtpEmail({
        name: '',
        otp: otp,
        purpose: 'You have requested to reset your password. Use the OTP below to complete the process.',
        accentColor: '#F59E0B' // Amber color for password reset
      })
    });

    res.status(200).json({ message: "OTP sent to your email!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// Reset Password - Using OTP to Reset Password
app.post("/api/user/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    if (new Date() > otpEntry.expiresAt) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (otpEntry.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the user's password
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    // Delete OTP after password reset
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "Server error during password reset." });
  }
});

//--------------------------------------------ADMIN----------------------------------------------

// backend/server.js

// Admin session check middleware
const checkAdminSession = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ message: 'Session expired: Please login again' });
  }

  if (!token) {
    return res.status(401).json({ message: 'No token: Please login again' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.adminId !== req.session.adminId.toString()) {
      return res.status(401).json({ message: 'Invalid session: Please login again' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token: Please login again' });
  }
};

// Modified Admin Login Route
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set admin session
    req.session.adminId = admin._id;
    req.session.adminEmail = admin.email;

    // Generate JWT token with adminId to distinguish admin role
    const token = jwt.sign(
      { 
        adminId: admin._id,
        email: admin.email,
        role: 'admin'  // Explicitly set role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token in cookie for extra security
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({ 
      message: "Login successful",
      token,
      admin: {
        email: admin.email,
        id: admin._id,
        role: 'admin'  // Include role in response
      }
    });

  } catch (error) {
    console.error("🚨 Server error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Admin logout route
app.post('/api/admin/logout', verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Clear admin session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ message: "Error during logout" });
        }
      });
    }
    
    // Clear cookie
    res.clearCookie('adminToken');
    
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during admin logout:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

// Protect admin routes with session check
app.get('/api/admin/check-auth', checkAdminSession, (req, res) => {
  res.json({ 
    isAuthenticated: true, 
    admin: {
      email: req.session.adminEmail,
      id: req.session.adminId
    }
  });
});

// NOTE: Removed global admin session enforcement for public routes. Admin-only routes should explicitly use `checkAdminSession`.
// For example: `app.use('/api/admin', checkAdminSession);` or add `checkAdminSession` to specific admin-only routes.
// app.use('/api/courses', checkAdminSession);
// app.use('/api/users', checkAdminSession);
// app.use('/api/jobs', checkAdminSession);

// --------------------------------------------COURSE MANAGEMENT----------------------------------------------

//  API to Upload a Course (With Course Link Support)
app.post('/api/courses', upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, category, duration, courseLink, youtubeUrl, skills } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !duration) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Parse skills from JSON string to array
    let parsedSkills = [];
    try {
      parsedSkills = skills ? JSON.parse(skills) : [];
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format" });
    }
    
    if (!parsedSkills.length) {
      return res.status(400).json({ message: "At least one skill is required" });
    }

    // Create a new course
    const newCourse = new Course({
      title,
      description,
      category,
      duration,
      courseLink: courseLink || "",
      youtubeUrl: youtubeUrl || "",
      thumbnail: req.file ? `/uploads/${req.file.filename}` : null,
      skills: parsedSkills
    });

    // Save the course to the database
    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error("Error creating course:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error while creating course" });
  }
});

//  API to Fetch All Courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching courses' });
  }
});

// API alias: Fetch all courses (explicit endpoint used by frontend)
app.get('/api/courses/all', async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'All courses retrieved successfully', courses });
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ error: 'Error fetching all courses' });
  }
});

// API to Fetch Recommended Courses based on skills query parameter
// Example: /api/courses/recommended?skills=Python,C%2B%2B
app.get('/api/courses/recommended', async (req, res) => {
  try {
    const skillsParam = req.query.skills || '';
    let skills = [];

    if (typeof skillsParam === 'string' && skillsParam.length) {
      // Support CSV list
      skills = skillsParam.split(',').map(s => decodeURIComponent(s.trim()));
    }

    let courses;
    if (skills.length > 0) {
      // Find courses that list any of the skills
      courses = await Course.find({ skills: { $in: skills } }).limit(20);
    } else {
      // Fallback: return most recent courses
      courses = await Course.find().sort({ createdAt: -1 }).limit(20);
    }

    res.status(200).json({ message: 'Recommended courses retrieved successfully', courses });
  } catch (error) {
    console.error('Error fetching recommended courses:', error);
    res.status(500).json({ error: 'Error fetching recommended courses' });
  }
});

//  API to Delete a Course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting course' });
  }
});

//  API to Update a Course
app.put('/api/courses/:id', upload.single('thumbnail'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, category, duration, courseLink, youtubeUrl, skills } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !duration) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Parse skills from JSON string to array
    let parsedSkills = [];
    try {
      parsedSkills = skills ? JSON.parse(skills) : [];
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format" });
    }
    
    if (!parsedSkills.length) {
      return res.status(400).json({ message: "At least one skill is required" });
    }

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Update course fields
    course.title = title;
    course.description = description;
    course.category = category;
    course.duration = duration;
    course.courseLink = courseLink || "";
    course.youtubeUrl = youtubeUrl || "";
    course.skills = parsedSkills;

    // Update thumbnail if a new file is uploaded
    if (req.file) {
      course.thumbnail = `/uploads/${req.file.filename}`;
    }

    // Save the updated course
    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error while updating course" });
  }
});

// --------------------------------------------User MANAGEMENT----------------------------------------------

//  API to Fetch All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

//  API to Delete a User by ID
app.delete("/api/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting user" });
  }
});

// --------------------------------------------JOB MANAGEMENT----------------------------------------------

// ✅ API to Fetch All Jobs
app.get("/api/jobs", async (req, res) => {
  try {
    // Find all verified and active jobs
    const jobs = await Job.find({ 
      verified: true,
      status: 'active',
      expiryDate: { $gt: new Date() } // Only return jobs that haven't expired
    })
    .sort({ createdAt: -1 })
    .populate('company', 'name logo website industry'); // Populate company details
    
    res.status(200).json({
      message: "Jobs retrieved successfully",
      jobs: jobs
    });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API alias: Fetch all jobs (explicit endpoint used by frontend)
app.get('/api/jobs/all', async (req, res) => {
  try {
    const jobs = await Job.find({ verified: true, status: 'active', expiryDate: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .populate('company', 'name logo website industry');

    res.status(200).json({ message: 'All jobs retrieved successfully', jobs });
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ error: 'Error fetching all jobs' });
  }
});

// API to Fetch Recommended Jobs based on skills query parameter
// Example: /api/jobs/recommended?skills=Python,C%2B%2B
app.get('/api/jobs/recommended', async (req, res) => {
  try {
    const skillsParam = req.query.skills || '';
    let skills = [];

    if (typeof skillsParam === 'string' && skillsParam.length) {
      skills = skillsParam.split(',').map(s => decodeURIComponent(s.trim()));
    }

    let jobs;
    if (skills.length > 0) {
      jobs = await Job.find({
        verified: true,
        status: 'active',
        expiryDate: { $gt: new Date() },
        skills: { $in: skills }
      })
      .sort({ createdAt: -1 })
      .populate('company', 'name logo website industry');
    } else {
      jobs = await Job.find({ verified: true, status: 'active', expiryDate: { $gt: new Date() } })
        .sort({ createdAt: -1 })
        .populate('company', 'name logo website industry');
    }

    res.status(200).json({ message: 'Recommended jobs retrieved successfully', jobs });
  } catch (error) {
    console.error('Error fetching recommended jobs:', error);
    res.status(500).json({ error: 'Error fetching recommended jobs' });
  }
});

// ✅ API to Fetch All Jobs for Admin (including unverified and inactive)
app.get("/api/admin/jobs", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Find all jobs regardless of status
    const jobs = await Job.find({})
      .sort({ createdAt: -1 })
      .populate('company', 'name logo website industry'); // Populate company details
    
    res.status(200).json({
      message: "All jobs retrieved successfully",
      jobs: jobs
    });
  } catch (error) {
    console.error("Error retrieving jobs for admin:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ API to Delete a Job by ID
app.delete("/api/jobs/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Error deleting job" });
  }
});

// ✅ API to Update a Job's Status
app.put("/api/jobs/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    
    const { status } = req.body;
    
    if (!status || !['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.json({ 
      message: "Job status updated successfully",
      job: updatedJob
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ error: "Error updating job status" });
  }
});

// Get user profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
app.put('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const { name, bio, skills, education, experience, certifications } = req.body;
    
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (skills) user.skills = skills;
    if (education) user.education = education;
    if (experience) user.experience = experience;
    if (certifications) user.certifications = certifications;

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user tasks
app.get('/api/user/tasks', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Update task status
app.put('/api/user/tasks/:taskId', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const task = user.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    await user.save();
    
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Get user learning paths
app.get('/api/user/learning-paths', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.learningPaths);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching learning paths' });
  }
});

// Update learning path progress
app.put('/api/user/learning-paths/:pathId', verifyToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const user = await User.findOne({ email: req.user.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const learningPath = user.learningPaths.id(req.params.pathId);
    if (!learningPath) {
      return res.status(404).json({ message: 'Learning path not found' });
    }

    learningPath.progress = progress;
    await user.save();
    
    res.json({ message: 'Progress updated successfully', learningPath });
  } catch (error) {
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// Update profile picture
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/profile-pictures'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfilePicture = multer({ 
  storage: profilePictureStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

app.post('/api/user/profile-picture', verifyToken, uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile picture path
    user.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Profile picture updated successfully', profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile picture' });
  }
});

// Gemini API proxy endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, systemPrompt } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('Sending request to Gemini API with message:', message);
    console.log('Using API key:', apiKey.substring(0, 5) + '...');

    // Prepare the contents array with system instruction and user message
    const requestBody = {
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
        topK: 40
      }
    };

    // Add system instruction if provided
    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: apiKey
        }
      }
    );

    console.log('Gemini API response received');
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Handle both Gemini 1.0 and 2.0 response formats
    if (
      (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) && 
      (!response.data?.contents?.[0]?.parts?.[0]?.text)
    ) {
      console.error('Invalid response structure from Gemini API:', response.data);
      throw new Error('Invalid response from Gemini API');
    }

    // Return the response as is to let the frontend handle the structure
    res.json(response.data);
  } catch (error) {
    console.error('Chatbot error:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      return res.status(403).json({ error: 'Invalid API key or authentication error' });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later' });
    }

    res.status(500).json({
      error: 'Error communicating with AI service',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Verify a job
app.put("/api/jobs/:id/verify", verifyToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { verified } = req.body;

    // Find the job and update its verification status
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { verified: verified },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error verifying job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin route to verify a job
app.put("/api/admin/verify-job/:jobId", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    const jobId = req.params.jobId;
    const { verified } = req.body;
    
    // Find and update the job
    const job = await Job.findByIdAndUpdate(
      jobId, 
      { verified: verified !== undefined ? verified : true }, 
      { new: true }
    );
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Send notification to the company that posted the job (in a real app)
    // This would typically involve sending an email or in-app notification
    
    res.status(200).json({
      message: `Job ${verified ? 'verified' : 'unverified'} successfully`,
      job: job
    });
  } catch (error) {
    console.error("Error verifying job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// User route to apply for a job
app.post("/api/jobs/:jobId/apply", verifyToken, async (req, res) => {
  try {
    // Check if user is a regular user (not company or admin)
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: "Only users can apply for jobs" });
    }
    
    const jobId = req.params.jobId;
    const userId = req.user.id;
    
    // Find the job
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Check if job is verified and active
    if (!job.verified || job.status !== 'active') {
      return res.status(400).json({ message: "This job is not available for applications" });
    }
    
    // Check if job has expired
    if (new Date(job.expiryDate) < new Date()) {
      return res.status(400).json({ message: "This job posting has expired" });
    }
    
    // Check if user has already applied
    if (job.applicants.includes(userId)) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }
    
    // Add user to applicants array
    job.applicants.push(userId);
    await job.save();
    
    res.status(200).json({
      message: "Application submitted successfully",
      job: job
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Company route to view applicants for a job
app.get("/api/company/jobs/:jobId/applicants", verifyToken, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const companyId = req.user.id;
    
    // Find the job and check if it belongs to the company
    const job = await Job.findOne({ _id: jobId, company: companyId });
    
    if (!job) {
      return res.status(404).json({ message: "Job not found or you don't have permission to view it" });
    }
    
    // Populate the applicants field with user details
    const populatedJob = await Job.findById(jobId).populate({
      path: 'applicants',
      select: 'name email profilePicture skills education experience' // Select only necessary fields
    });
    
    res.status(200).json({
      message: "Applicants retrieved successfully",
      applicants: populatedJob.applicants
    });
  } catch (error) {
    console.error("Error retrieving applicants:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get company profile
app.get("/api/company/profile", verifyToken, async (req, res) => {
  try {
    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: "Unauthorized. Company access required." });
    }
    
    // Get company ID from token
    const companyId = req.user.id;
    
    // Find company by ID
    const company = await Company.findById(companyId).select('-password');
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Return company data directly for easier frontend consumption
    res.status(200).json(company);
  } catch (error) {
    console.error("Error retrieving company profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update company profile
app.put("/api/company/update-profile", verifyToken, upload.single('logo'), async (req, res) => {
  try {
    // Check if user is a company
    if (req.user.role !== 'company') {
      return res.status(403).json({ message: "Unauthorized. Company access required." });
    }
    
    // Get company ID from token
    const companyId = req.user.id;
    
    // Find company by ID
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    // Update fields
    const updateFields = [
      'name', 'email', 'website', 'phoneNumber', 'location', 
      'industry', 'size', 'foundedYear', 'description'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });
    
    // If name is updated, also update companyName for consistency
    if (req.body.name) {
      company.companyName = req.body.name;
    }
    
    // Handle social media fields
    if (req.body['socialMedia[linkedin]'] || 
        req.body['socialMedia[twitter]'] || 
        req.body['socialMedia[facebook]'] || 
        req.body['socialMedia[instagram]']) {
      
      company.socialMedia = {
        linkedin: req.body['socialMedia[linkedin]'] || company.socialMedia?.linkedin || '',
        twitter: req.body['socialMedia[twitter]'] || company.socialMedia?.twitter || '',
        facebook: req.body['socialMedia[facebook]'] || company.socialMedia?.facebook || '',
        instagram: req.body['socialMedia[instagram]'] || company.socialMedia?.instagram || ''
      };
    }
    
    // Handle logo upload
    if (req.file) {
      // If there's an existing logo, delete it
      if (company.logo) {
        const oldLogoPath = path.join(__dirname, company.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
      
      // Save the new logo path
      company.logo = req.file.path.replace(/\\/g, '/').replace('backend/', '');
    }
    
    // Save the updated company
    await company.save();
    
    // Return the updated company
    res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      company
    });
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while updating profile" 
    });
  }
});

// Admin route to get all companies
app.get("/api/admin/companies", verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    // Fetch all companies
    const companies = await Company.find().select('-password');
    
    res.status(200).json({
      success: true,
      companies
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching companies" 
    });
  }
});

// Admin check authentication route
app.get('/api/admin/check-auth', verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        isAuthenticated: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    // Get admin ID from token
    const adminId = req.user.adminId;
    
    // Find admin by ID
    const admin = await Admin.findById(adminId).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        isAuthenticated: false,
        message: "Admin not found" 
      });
    }
    
    res.status(200).json({
      isAuthenticated: true,
      admin: {
        id: admin._id,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error("Error checking admin authentication:", error);
    res.status(500).json({ 
      isAuthenticated: false,
      message: "Server error while checking authentication" 
    });
  }
});

// Admin dashboard stats route
app.get('/api/admin/dashboard/stats', verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Get counts from different collections
    const usersCount = await User.countDocuments();
    const jobsCount = await Job.countDocuments();
    const coursesCount = await Course.countDocuments();
    
    // For now, we don't have an assessments collection, so we'll use 0
    const assessmentsCount = 0;
    
    res.status(200).json({
      users: usersCount,
      jobs: jobsCount,
      assessments: assessmentsCount,
      courses: coursesCount
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Server error while fetching dashboard stats" });
  }
});

// Admin dashboard activity route
app.get('/api/admin/dashboard/activity', verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name email createdAt');
    
    // Get recent jobs
    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('jobTitle companyName createdAt');
    
    // Format the activity data
    const activity = [
      ...recentUsers.map(user => ({
        type: 'user',
        action: 'New User Registration',
        description: `${user.name || user.email} has registered on the platform`,
        time: formatDate(user.createdAt)
      })),
      ...recentJobs.map(job => ({
        type: 'job',
        action: 'Job Posted',
        description: `A new job "${job.jobTitle}" has been posted by ${job.companyName}`,
        time: formatDate(job.createdAt)
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
    
    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching admin dashboard activity:", error);
    res.status(500).json({ message: "Server error while fetching dashboard activity" });
  }
});

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}

// Get available jobs for users
app.get("/api/user/available-jobs", verifyToken, async (req, res) => {
  try {
    const jobs = await Job.find({
      status: { $in: ['active', 'draft'] },
      expiryDate: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('company', 'companyName location');

    res.json({ success: true, jobs });
  } catch (error) {
    console.error("Error fetching available jobs:", error);
    res.status(500).json({ success: false, message: "Error fetching jobs", error: error.message });
  }
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/assessment', skillAssessmentRoutes);
app.use('/api/practice', skillPracticeRoutes);
app.use('/api/user/report', reportRoutes);
const leaderboardRoutes = require('./routes/leaderboardRoutes');
app.use('/api/leaderboard', leaderboardRoutes);

// Public verification endpoint (read-only, safe fields)
const SkillReport = require('./models/SkillReport');
app.get('/api/verify/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const report = await SkillReport.findOne({ publicId, isActive: true }).lean();
    if (!report) return res.status(404).json({ error: 'Report not found or inactive' });
    const User = require('./models/User');
    const user = await User.findById(report.userId).select('name profilePicture').lean();
    const safe = {
      publicId: report.publicId,
      createdAt: report.createdAt,
      badge: report.badge,
      avgSkillScore: report.avgSkillScore,
      topSkills: report.topSkills,
      timeline: report.timeline,
      skillScoresSnapshot: report.skillScoresSnapshot,
      user: user || null
    };
    res.json({ report: safe });
  } catch (error) {
    console.error('Error in public verify route:', error);
    res.status(500).json({ error: error.message || 'Error fetching report' });
  }
});



// Listen
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});

// Rate Limiting Middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

// Note: CORS is configured earlier using the dynamic allowlist `corsOptions`.
app.use(cookieParser());
app.use(bodyParser.json());

// Apply rate limiting to auth routes
app.use('/api/user/login', loginLimiter);
app.use('/api/admin/login', loginLimiter);

// Serve static files with caching
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.png')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Admin route to get all users
app.get("/api/admin/users", verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    // Fetch all users
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching users" 
    });
  }
});

// Admin route to delete a user
app.delete("/api/admin/users/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    // Delete the user
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting user" 
    });
  }
});

// Admin route to get all courses
app.get("/api/admin/courses", verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    // Fetch all courses
    const courses = await Course.find();
    
    res.status(200).json({
      success: true,
      courses
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching courses" 
    });
  }
});

// Admin route to create a course
app.post("/api/admin/courses", verifyToken, upload.single('thumbnail'), async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    const { title, description, category, duration, courseLink, youtubeUrl, skills } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !duration) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Parse skills from JSON string to array
    let parsedSkills = [];
    try {
      parsedSkills = skills ? JSON.parse(skills) : [];
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format" });
    }
    
    if (!parsedSkills.length) {
      return res.status(400).json({ message: "At least one skill is required" });
    }

    // Create a new course
    const newCourse = new Course({
      title,
      description,
      category,
      duration,
      courseLink: courseLink || "",
      youtubeUrl: youtubeUrl || "",
      thumbnail: req.file ? `/uploads/${req.file.filename}` : null,
      skills: parsedSkills
    });

    // Save the course to the database
    const savedCourse = await newCourse.save();
    
    res.status(201).json({
      success: true,
      course: savedCourse
    });
  } catch (error) {
    console.error("Error creating course:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error while creating course" });
  }
});

// Admin route to update a course
app.put("/api/admin/courses/:id", verifyToken, upload.single('thumbnail'), async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    const courseId = req.params.id;
    const { title, description, category, duration, courseLink, youtubeUrl, skills } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !duration) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    
    // Parse skills from JSON string to array
    let parsedSkills = [];
    try {
      parsedSkills = skills ? JSON.parse(skills) : [];
    } catch (error) {
      return res.status(400).json({ message: "Invalid skills format" });
    }
    
    if (!parsedSkills.length) {
      return res.status(400).json({ message: "At least one skill is required" });
    }

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Update course fields
    course.title = title;
    course.description = description;
    course.category = category;
    course.duration = duration;
    course.courseLink = courseLink || "";
    course.youtubeUrl = youtubeUrl || "";
    course.skills = parsedSkills;

    // Update thumbnail if a new file is uploaded
    if (req.file) {
      course.thumbnail = `/uploads/${req.file.filename}`;
    }

    // Save the updated course
    const updatedCourse = await course.save();
    
    res.status(200).json({
      success: true,
      course: updatedCourse
    });
  } catch (error) {
    console.error("Error updating course:", error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: "Server error while updating course" });
  }
});

// Admin route to delete a course
app.delete("/api/admin/courses/:id", verifyToken, async (req, res) => {
  try {
    // Check if user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. Admin access required." 
      });
    }
    
    const courseId = req.params.id;
    
    // Find and delete the course
    const deletedCourse = await Course.findByIdAndDelete(courseId);
    
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error while deleting course" });
  }
});