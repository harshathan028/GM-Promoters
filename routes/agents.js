const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Agent, Land, Transaction, AgentLandAssignment } = require('../models');
const { isAuthenticated, isAdmin, isAdminOrAgent } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

router.use(isAuthenticated);

// Validation rules
const agentValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('commissionPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission must be 0-100')
];

// Generate agent ID
const generateAgentId = async () => {
    const count = await Agent.count();
    return `AGT-${String(count + 1).padStart(4, '0')}`;
};

// Get all agents
router.get('/', async (req, res) => {
    try {
        const { search, isActive, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

        const where = {};
        if (search) {
            where[Op.or] = [
                { agentId: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: agents, count: total } = await Agent.findAndCountAll({
            where,
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset
        });

        // Get additional stats for each agent
        const agentsWithStats = await Promise.all(agents.map(async (agent) => {
            const assignedLandsCount = await AgentLandAssignment.count({
                where: { agentId: agent.id, status: 'active' }
            });
            const soldLandsCount = await Transaction.count({
                where: { agentId: agent.id }
            });
            const totalCommission = await Transaction.sum('commissionAmount', {
                where: { agentId: agent.id, status: 'completed' }
            }) || 0;

            return {
                ...agent.toJSON(),
                stats: { assignedLandsCount, soldLandsCount, totalCommission }
            };
        }));

        res.json({
            success: true,
            data: agentsWithStats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get agents error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single agent with details
router.get('/:id', async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.id, {
            include: [
                {
                    model: Land,
                    as: 'assignedLands',
                    through: { attributes: ['assignmentDate', 'status'] }
                },
                {
                    model: Transaction,
                    as: 'transactions',
                    include: [
                        { model: Land, as: 'land', attributes: ['landId', 'location', 'price'] },
                        { model: Customer, as: 'customer', attributes: ['name'] }
                    ]
                }
            ]
        });

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        // Calculate commission stats
        const totalSales = agent.transactions?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;
        const totalCommission = agent.transactions?.reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0) || 0;
        const pendingCommission = agent.transactions?.filter(t => !t.commissionPaid)
            .reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0) || 0;

        res.json({
            success: true,
            data: {
                ...agent.toJSON(),
                stats: { totalSales, totalCommission, pendingCommission }
            }
        });
    } catch (error) {
        console.error('Get agent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create agent
router.post('/', isAdmin, agentValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const agentId = await generateAgentId();

        const agent = await Agent.create({
            ...req.body,
            agentId,
            commissionPercent: req.body.commissionPercent || 2.00
        });

        await logActivity(req.session.user.id, 'create', 'agent', agent.id, `Created agent ${agent.name}`, null, agent.toJSON(), req);

        res.status(201).json({ success: true, data: agent, message: 'Agent created successfully' });
    } catch (error) {
        console.error('Create agent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update agent
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const oldValues = agent.toJSON();
        await agent.update(req.body);

        await logActivity(req.session.user.id, 'update', 'agent', agent.id, `Updated agent ${agent.name}`, oldValues, agent.toJSON(), req);

        res.json({ success: true, data: agent, message: 'Agent updated successfully' });
    } catch (error) {
        console.error('Update agent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete agent
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.id);
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        // Check for active assignments
        const activeAssignments = await AgentLandAssignment.count({
            where: { agentId: agent.id, status: 'active' }
        });

        if (activeAssignments > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete agent with active land assignments. Reassign or complete them first.'
            });
        }

        const oldValues = agent.toJSON();
        await agent.destroy();

        await logActivity(req.session.user.id, 'delete', 'agent', req.params.id, `Deleted agent ${agent.name}`, oldValues, null, req);

        res.json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Delete agent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Calculate commission for an agent
router.get('/:id/commission', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const agent = await Agent.findByPk(req.params.id);

        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        const where = { agentId: agent.id, status: 'completed' };
        if (startDate) where.transactionDate = { ...where.transactionDate, [Op.gte]: startDate };
        if (endDate) where.transactionDate = { ...where.transactionDate, [Op.lte]: endDate };

        const transactions = await Transaction.findAll({
            where,
            include: [{ model: Land, as: 'land', attributes: ['landId', 'location', 'price'] }],
            order: [['transactionDate', 'DESC']]
        });

        const summary = {
            totalTransactions: transactions.length,
            totalSalesAmount: transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
            totalCommission: transactions.reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0),
            paidCommission: transactions.filter(t => t.commissionPaid)
                .reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0),
            pendingCommission: transactions.filter(t => !t.commissionPaid)
                .reduce((sum, t) => sum + parseFloat(t.commissionAmount || 0), 0)
        };

        res.json({ success: true, data: { agent, transactions, summary } });
    } catch (error) {
        console.error('Get commission error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get agent's assigned lands
router.get('/:id/lands', async (req, res) => {
    try {
        const assignments = await AgentLandAssignment.findAll({
            where: { agentId: req.params.id },
            include: [{
                model: Land,
                attributes: ['id', 'landId', 'location', 'areaSize', 'price', 'status']
            }]
        });

        res.json({ success: true, data: assignments });
    } catch (error) {
        console.error('Get agent lands error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
