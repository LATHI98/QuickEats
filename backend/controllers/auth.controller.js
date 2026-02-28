import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  canteen: user.canteen,
});

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: generateToken(user._id), user: userPayload(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};

// POST /api/auth/create-user  (superAdmin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, canteen } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const user = await User.create({ name, email, password, role, studentId, canteen });
    res.status(201).json({
      message: 'User created successfully',
      user: userPayload(user),
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
