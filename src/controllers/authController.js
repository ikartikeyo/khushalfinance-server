import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Staff / Admin Login
 */
export async function login(req, res, next) {
  try {
    const rawIdentifier = (req.body.email || req.body.username || '').trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: rawIdentifier },
        { email: `${rawIdentifier}@gmail.com` },
        { email: rawIdentifier.replace(/@.*$/, '') + '@gmail.com' },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username/email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Audit log
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      resource: 'AUTH',
      resourceId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((e) => console.error('Audit log failed:', e.message));

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get profile of current logged-in user
 */
export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

/**
 * Register new staff member (Admin only)
 */
export async function registerStaff(req, res, next) {
  try {
    const { name, email, password, role = 'LOAN_OFFICER', phone } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List all staff users (Admin only)
 */
export async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user status or role (Admin only)
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { role, isActive, name, phone } = req.body;

    const updated = await User.findByIdAndUpdate(
      id,
      {
        ...(role && { role }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(name && { name }),
        ...(phone && { phone }),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}
