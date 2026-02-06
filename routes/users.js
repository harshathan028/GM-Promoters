const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(isAuthenticated);
router.use(isAdmin);

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { password, ...updateData } = req.body;
        await user.update(updateData);

        await logActivity(req.session.user.id, 'update', 'user', user.id, `Updated user ${user.username}`, null, null, req);
        res.json({ success: true, data: user, message: 'User updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Toggle user active status
router.post('/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.update({ isActive: !user.isActive });
        res.json({ success: true, data: user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Change user role
router.post('/:id/change-role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'agent', 'staff'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.update({ role });
        await logActivity(req.session.user.id, 'update', 'user', user.id, `Changed role to ${role}`, null, null, req);
        res.json({ success: true, data: user, message: 'Role updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
