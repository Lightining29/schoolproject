import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import { protect } from '../middleware/auth.js';
import mockStore from '../config/mockStore.js';

const router = express.Router();

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'apna_school_jwt_secret_key_123', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userRole = role || 'user';

    if (userRole === 'parent' || userRole === 'teacher') {
      return res.status(400).json({
        success: false,
        message: `Self-registration for ${userRole}s is disabled. Accounts are provisioned by the school administration team.`
      });
    }

    if (mockStore.isMock) {
      // Check mock store
      const userExists = await mockStore.findOne('users', { email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      const newUser = await mockStore.create('users', {
        name,
        email,
        password: hashedPassword,
        role: userRole
      });

      // If parent or teacher, create mock profile
      if (userRole === 'parent') {
        const parentProfile = await mockStore.create('parents', {
          userId: newUser._id,
          name,
          email,
          phone: req.body.phone || 'Please update phone',
          address: req.body.address || 'Please update address',
          children: []
        });
        newUser.parentProfileId = parentProfile._id;
      } else if (userRole === 'teacher') {
        const teacherProfile = await mockStore.create('teachers', {
          userId: newUser._id,
          name,
          email,
          phone: req.body.phone || 'Please update phone',
          qualifications: req.body.qualifications || 'Please update qualifications',
          classesAssigned: []
        });
        newUser.teacherProfileId = teacherProfile._id;
      }

      return res.status(201).json({
        success: true,
        token: generateToken(newUser._id),
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    }

    // Mongoose MongoDB
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole
    });

    if (user) {
      // Create associated collections
      if (userRole === 'parent') {
        const parent = await Parent.create({
          userId: user._id,
          name,
          email,
          phone: req.body.phone || 'Please update',
          address: req.body.address || 'Please update',
          children: []
        });
      } else if (userRole === 'teacher') {
        const teacher = await Teacher.create({
          userId: user._id,
          name,
          email,
          phone: req.body.phone || 'Please update',
          qualifications: req.body.qualifications || 'Please update',
          classesAssigned: []
        });
      }

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password' });
  }

  const cleanEmail = email.toString().trim();
  const cleanPassword = password.toString().trim();

  try {
    if (mockStore.isMock) {
      const user = await mockStore.findOne('users', { email: cleanEmail });
      if (user && bcrypt.compareSync(cleanPassword, user.password)) {
        return res.json({
          success: true,
          token: generateToken(user._id),
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // MongoDB (Exact match first, then case-insensitive regex fallback)
    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    }).select('+password');

    if (user && (await user.matchPassword(cleanPassword))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (mockStore.isMock) {
      const user = req.user;
      let profile = {};

      if (user.role === 'parent') {
        profile = await mockStore.findOne('parents', { userId: user._id });
        // Retrieve children
        if (profile) {
          const children = await mockStore.find('students', { parentId: profile._id });
          profile = { ...profile, children };
        }
      } else if (user.role === 'teacher') {
        profile = await mockStore.findOne('teachers', { userId: user._id });
      }

      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        },
        profile
      });
    }

    // MongoDB
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'parent') {
      profile = await Parent.findOne({ userId: user._id }).populate('children');
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
