const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Land, Agent, Customer, Transaction, AgentLandAssignment } = require('../models');
const { isAuthenticated, isAdminOrAgent } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const upload = require('../middleware/upload');

// Apply authentication to all routes
router.use(isAuthenticated);

// Validation rules
const landValidation = [
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('areaSize').isFloat({ min: 0 }).withMessage('Valid area size is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('landType').isIn(['residential', 'commercial', 'agricultural', 'industrial', 'mixed'])
        .withMessage('Invalid land type')
];

// Generate unique land ID
const generateLandId = async () => {
    const count = await Land.count();
    return `LAND-${String(count + 1).padStart(5, '0')}`;
};

// Get all lands with filters
router.get('/', async (req, res) => {
    try {
        const {
            search, status, landType, minPrice, maxPrice,
            location, agentId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC'
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { landId: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } },
                { surveyNumber: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (status) where.status = status;
        if (landType) where.landType = landType;
        if (location) where.location = { [Op.like]: `%${location}%` };
        if (minPrice) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
        if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
        if (agentId) where.primaryAgentId = agentId;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: lands, count: total } = await Land.findAndCountAll({
            where,
            include: [
                { model: Agent, as: 'primaryAgent', attributes: ['id', 'agentId', 'name'] },
                { model: Customer, as: 'buyer', attributes: ['id', 'customerId', 'name'] }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: lands,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get lands error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single land
router.get('/:id', async (req, res) => {
    try {
        const land = await Land.findByPk(req.params.id, {
            include: [
                { model: Agent, as: 'primaryAgent' },
                { model: Customer, as: 'buyer' },
                {
                    model: Agent,
                    as: 'assignedAgents',
                    through: { attributes: ['assignmentDate', 'status'] }
                },
                { model: Transaction, as: 'transactions', include: [{ model: Customer, as: 'customer' }] }
            ]
        });

        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        res.json({ success: true, data: land });
    } catch (error) {
        console.error('Get land error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create land
router.post('/', isAdminOrAgent, upload.array('documents', 5), landValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const landId = await generateLandId();
        const documents = req.files ? req.files.map(f => f.path) : [];

        const landData = {
            location: req.body.location,
            areaSize: parseFloat(req.body.areaSize),
            areaUnit: req.body.areaUnit || 'sqft',
            price: parseFloat(req.body.price),
            surveyNumber: req.body.surveyNumber || null,
            landType: req.body.landType || 'residential',
            status: req.body.status || 'available',
            description: req.body.description || null,
            coordinates: req.body.coordinates || null,
            landId,
            documents: JSON.stringify(documents)
        };

        const land = await Land.create(landData);

        // Log activity - wrap in try/catch to prevent failures from breaking the response
        try {
            await logActivity(req.session.user.id, 'create', 'land', land.id, `Created land ${landId}`, null, land.toJSON(), req);
        } catch (logError) {
            console.error('Activity log error:', logError);
        }

        res.status(201).json({ success: true, data: land, message: 'Land created successfully' });
    } catch (error) {
        console.error('Create land error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// Update land
router.put('/:id', isAdminOrAgent, upload.array('documents', 5), async (req, res) => {
    try {
        const land = await Land.findByPk(req.params.id);
        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        const oldValues = land.toJSON();
        let documents = land.documents || [];

        if (req.files && req.files.length > 0) {
            documents = [...documents, ...req.files.map(f => f.path)];
        }

        await land.update({ ...req.body, documents });

        await logActivity(req.session.user.id, 'update', 'land', land.id, `Updated land ${land.landId}`, oldValues, land.toJSON(), req);

        res.json({ success: true, data: land, message: 'Land updated successfully' });
    } catch (error) {
        console.error('Update land error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete land
router.delete('/:id', isAdminOrAgent, async (req, res) => {
    try {
        const land = await Land.findByPk(req.params.id);
        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        const oldValues = land.toJSON();
        await land.destroy();

        await logActivity(req.session.user.id, 'delete', 'land', req.params.id, `Deleted land ${land.landId}`, oldValues, null, req);

        res.json({ success: true, message: 'Land deleted successfully' });
    } catch (error) {
        console.error('Delete land error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark land as sold
router.post('/:id/mark-sold', isAdminOrAgent, async (req, res) => {
    try {
        const land = await Land.findByPk(req.params.id);
        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        const oldValues = land.toJSON();
        await land.update({
            status: 'sold',
            purchasedBy: req.body.customerId || null
        });

        await logActivity(req.session.user.id, 'update', 'land', land.id, `Marked land ${land.landId} as sold`, oldValues, land.toJSON(), req);

        res.json({ success: true, data: land, message: 'Land marked as sold' });
    } catch (error) {
        console.error('Mark sold error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Assign agent to land
router.post('/:id/assign-agent', isAdminOrAgent, async (req, res) => {
    try {
        const { agentId, isPrimary } = req.body;

        const land = await Land.findByPk(req.params.id);
        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        const agent = await Agent.findByPk(agentId);
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }

        // Create assignment
        await AgentLandAssignment.findOrCreate({
            where: { landId: land.id, agentId: agent.id },
            defaults: { status: 'active' }
        });

        // Set as primary if requested
        if (isPrimary) {
            await land.update({ primaryAgentId: agent.id });
        }

        await logActivity(req.session.user.id, 'assign', 'land', land.id, `Assigned agent ${agent.name} to land ${land.landId}`, null, { agentId, isPrimary }, req);

        res.json({ success: true, message: 'Agent assigned successfully' });
    } catch (error) {
        console.error('Assign agent error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get land statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await Land.count();
        const available = await Land.count({ where: { status: 'available' } });
        const reserved = await Land.count({ where: { status: 'reserved' } });
        const sold = await Land.count({ where: { status: 'sold' } });

        const totalValue = await Land.sum('price') || 0;
        const soldValue = await Land.sum('price', { where: { status: 'sold' } }) || 0;

        res.json({
            success: true,
            data: { total, available, reserved, sold, totalValue, soldValue }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
