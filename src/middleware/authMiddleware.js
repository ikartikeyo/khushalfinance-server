import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';

/**
 * Authenticate JWT token from Authorization header
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please sign in.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive or no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please sign in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Guard
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
