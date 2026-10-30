const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No authentication token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    try {
      // Log the token for debugging (masked for security)
      const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 10);
      console.log(`Processing token: ${maskedToken}`);
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
      console.log('Decoded token:', JSON.stringify(decoded));
      
      // Add decoded token data to the request
      req.user = decoded;
      
      // If userId exists in token, try to find the user
      if (decoded.userId) {
        console.log(`Lookup user ID: ${decoded.userId}`);
        
        // Check if user still exists
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          console.log(`User not found with ID: ${decoded.userId}`);
          throw new Error('User not found');
        }

        console.log(`User found: ${user.name || user.email}`);

        // Check if token is in user's tokens list (if implementing token blacklisting)
        if (user.invalidatedTokens && user.invalidatedTokens.includes(token)) {
          console.log('Token has been invalidated');
          throw new Error('Token has been invalidated');
        }
        
        // Update last activity timestamp
        user.lastActive = new Date();
        await user.save();
      } else {
        console.log('No userId found in token. Token data:', decoded);
      }

      // Add token to request
      req.token = token;
      
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      console.error('Error details:', error);
      return res.status(401).json({ message: 'Token is invalid or has expired' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

// Middleware for role-based access control
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    next();
  };
};

// Middleware to check if user owns the resource
const isResourceOwner = (resourceModel) => async (req, res, next) => {
  try {
    const resource = await resourceModel.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (resource.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this resource' });
    }

    req.resource = resource;
    next();
  } catch (error) {
    console.error('Resource ownership check failed:', error.message);
    res.status(500).json({ message: 'Server error checking resource ownership' });
  }
};

// Rate limiting middleware
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// Session activity tracking
const trackActivity = async (req, res, next) => {
  try {
    if (req.user) {
      const activity = {
        timestamp: new Date(),
        action: req.method,
        route: req.originalUrl,
        ip: req.ip
      };

      req.user.recentActivity = [
        activity,
        ...(req.user.recentActivity || []).slice(0, 9)
      ];

      await req.user.save();
    }
    next();
  } catch (error) {
    console.error('Activity tracking failed:', error.message);
    next();
  }
};

module.exports = {
  auth,
  authorize,
  isResourceOwner,
  rateLimit,
  trackActivity
}; 