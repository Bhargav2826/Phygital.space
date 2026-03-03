const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect route – verifies JWT from Authorization header.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const err = new Error('Not authorized to access this route');
        err.statusCode = 401;
        return next(err);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
        const err = new Error('User not found or deactivated');
        err.statusCode = 401;
        return next(err);
    }

    req.user = user;
    next();
};

/**
 * Authorize specific roles – use after protect.
 * @param  {...string} roles
 */
const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        const err = new Error(`Role '${req.user.role}' is not authorized for this route`);
        err.statusCode = 403;
        return next(err);
    }
    next();
};

module.exports = { protect, authorize };
