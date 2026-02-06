const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const { Land, Customer, Agent, Transaction, User, ActivityLog } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.use(isAuthenticated);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
    try {
        const totalLands = await Land.count();
        const availableLands = await Land.count({ where: { status: 'available' } });
        const reservedLands = await Land.count({ where: { status: 'reserved' } });
        const soldLands = await Land.count({ where: { status: 'sold' } });

        const totalRevenue = await Transaction.sum('amount', { where: { status: 'completed' } }) || 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyRevenue = await Transaction.sum('amount', {
            where: { status: 'completed', transactionDate: { [Op.gte]: startOfMonth } }
        }) || 0;

        const totalCustomers = await Customer.count();
        const totalAgents = await Agent.count({ where: { isActive: true } });
        const pendingCommissions = await Transaction.sum('commissionAmount', {
            where: { commissionPaid: false, status: 'completed' }
        }) || 0;

        const totalLandValue = await Land.sum('price') || 0;

        res.json({
            success: true,
            data: {
                lands: { total: totalLands, available: availableLands, reserved: reservedLands, sold: soldLands },
                revenue: { total: totalRevenue, monthly: monthlyRevenue },
                counts: { customers: totalCustomers, agents: totalAgents },
                commissions: { pending: pendingCommissions },
                landValues: { total: totalLandValue }
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Monthly sales
router.get('/monthly-sales', async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const monthlyData = [];

        for (let month = 1; month <= 12; month++) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = month === 12 ? `${parseInt(year) + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

            const sales = await Transaction.sum('amount', {
                where: { status: 'completed', transactionDate: { [Op.gte]: startDate, [Op.lt]: endDate } }
            }) || 0;

            monthlyData.push({ month, sales });
        }

        res.json({ success: true, data: monthlyData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Top agents
router.get('/top-agents', async (req, res) => {
    try {
        const agents = await Agent.findAll({
            where: { isActive: true },
            order: [['totalSales', 'DESC']],
            limit: 5
        });

        const data = await Promise.all(agents.map(async (agent) => {
            const totalSalesAmount = await Transaction.sum('amount', { where: { agentId: agent.id } }) || 0;
            return { ...agent.toJSON(), totalSalesAmount };
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Recent transactions
router.get('/recent-transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: Land, as: 'land', attributes: ['landId', 'location'] },
                { model: Customer, as: 'customer', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Activity log
router.get('/activity-log', isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows, count } = await ActivityLog.findAndCountAll({
            include: [{ model: User, as: 'user', attributes: ['username'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({ success: true, data: rows, pagination: { total: count, page: parseInt(page) } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
