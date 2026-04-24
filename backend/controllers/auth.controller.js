import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model.js';
import MenuItem from '../models/MenuItem.model.js';
import { sendVerificationEmail, sendOTPEmail } from '../services/email.service.js';
import { sendNotification } from '../services/socket.service.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  phoneNumber: user.phoneNumber,
  canteen: user.canteen,
});

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
      role: role || 'student',
      isVerified: true, // Verification removed as per user request
    });

    res.status(201).json({
      message: 'Registration successful! You can now login.',
      user: userPayload(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/verify-email?token=...
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(401).json({ message: 'Invalid role for this account' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ token: generateToken(user._id), user: userPayload(user) });

    // Send Trending Notification for students
    if (user.role === 'student') {
      try {
        const trendingMeal = await MenuItem.findOne({ isAvailable: true })
          .sort({ ratings: -1, numReviews: -1 })
          .populate('canteen', 'name');

        if (trendingMeal) {
          sendNotification(
            user._id,
            '🔥 Trending Now',
            `Try the ${trendingMeal.name} at ${trendingMeal.canteen?.name || 'our canteen'}! It's currently the top-rated choice.`,
            'info'
          );
        }
      } catch (err) {
        console.error('Failed to send trending notification:', err);
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};

// PUT /api/auth/me (protected) - Edit Profile
export const updateMe = async (req, res) => {
  try {
    const { name, email, studentId, phoneNumber } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (studentId) user.studentId = studentId;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();
    res.json({ message: 'Profile updated successfully', user: userPayload(user) });
  } catch (err) {
    console.error('Update me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/change-password (protected)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/auth/me (protected) - Delete Account
export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
