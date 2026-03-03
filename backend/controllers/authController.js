const User = require('../models/User');

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    const { name, email, password, organization, phone } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
        const err = new Error('An account with this email already exists');
        err.statusCode = 400;
        throw err;
    }

    const user = await User.create({ name, email, password, organization, phone });
    const token = user.getSignedJwt();

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
        },
    });
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        const err = new Error('Please provide email and password');
        err.statusCode = 400;
        throw err;
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
        const err = new Error('Invalid credentials or account deactivated');
        err.statusCode = 401;
        throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        throw err;
    }

    const token = user.getSignedJwt();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            organization: user.organization,
            avatar: user.avatar,
        },
    });
};

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
};

/**
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
    const { name, organization, phone } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { name, organization, phone },
        { new: true, runValidators: true }
    );
    res.json({ success: true, user });
};

module.exports = { register, login, getMe, updateProfile };
