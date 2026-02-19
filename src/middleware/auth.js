// Authentication Middleware
// Checks if user is logged in by verifying JWT token

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * AUTHENTICATE - Verify JWT token from cookie
 * 
 * This middleware runs before protected routes
 * It checks if the user has a valid auth token
 * 
 * If valid: allows request to continue, adds userId and role to req object
 * If invalid: blocks request, returns 401 Unauthorized
 * 
 * Usage in routes:
 *   router.get('/protected', authenticate, controller.function)
 */
function authenticate(req, res, next) {
  try {
    // Get token from cookie
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please login.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add userId and role to request object
    // Controllers can now access req.userId and req.role
    req.userId = decoded.userId;
    req.role = decoded.role;

    // Continue to next middleware/controller
    next();

  } catch (error) {
    // Token is invalid or expired
    return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
}

/**
 * REQUIRE_ROLE - Check if user has specific role
 * 
 * This middleware runs AFTER authenticate
 * Use it to protect staff/admin-only routes
 * 
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('admin'), controller.function)
 *   router.get('/staff-or-admin', authenticate, requireRole(['staff', 'admin']), controller.function)
 */
function requireRole(roles) {
  // Accept string or array of roles
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ 
        error: 'Forbidden. You do not have permission to access this resource.' 
      });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
