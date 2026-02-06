const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { logActivity } = require('../middleware/activityLogger');

// Validation rules
const loginValidation = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be 3-50 characters'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be 2-100 characters')
];

// Login
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        const user = await User.findOne({
            where: { username, isActive: true }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        };

        // Log activity
        await logActivity(user.id, 'login', 'user', user.id, 'User logged in', null, null, req);

        res.json({
            success: true,
            message: 'Login successful',
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Signup
router.post('/signup', signupValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password, fullName } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Create user with 'staff' role by default
        const user = await User.create({
            username,
            email,
            password,
            fullName,
            role: 'staff'
        });

        // Log activity
        await logActivity(user.id, 'signup', 'user', user.id, 'New user registered', null, null, req);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please login.',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    try {
        if (req.session?.user) {
            await logActivity(req.session.user.id, 'logout', 'user', req.session.user.id, 'User logged out', null, null, req);
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }
            res.clearCookie('connect.sid');
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
});

// Get current session
router.get('/session', (req, res) => {
    if (req.session?.user) {
        res.json({
            success: true,
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// Change password
router.post('/change-password', [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        if (!req.session?.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.session.user.id);

        const isValid = await user.validatePassword(currentPassword);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        await logActivity(user.id, 'password_change', 'user', user.id, 'Password changed', null, null, req);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
