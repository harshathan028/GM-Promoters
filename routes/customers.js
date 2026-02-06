const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Customer, Land, Transaction } = require('../models');
const { isAuthenticated, isAdminOrAgent } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const upload = require('../middleware/upload');

router.use(isAuthenticated);

// Validation rules
const customerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('email').optional().isEmail().withMessage('Valid email required')
];

// Generate customer ID
const generateCustomerId = async () => {
    const count = await Customer.count();
    return `CUST-${String(count + 1).padStart(5, '0')}`;
};

// Get all customers
router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

        const where = {};
        if (search) {
            where[Op.or] = [
                { customerId: { [Op.like]: `%${search}%` } },
                { name: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: customers, count: total } = await Customer.findAndCountAll({
            where,
            include: [
                { model: Land, as: 'purchasedLands', attributes: ['id', 'landId', 'location', 'price'] }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single customer with purchase history
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id, {
            include: [
                { model: Land, as: 'purchasedLands' },
                {
                    model: Transaction,
                    as: 'transactions',
                    include: [{ model: Land, as: 'land', attributes: ['landId', 'location'] }]
                }
            ]
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Calculate totals
        const totalPurchases = customer.transactions?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;
        const purchaseCount = customer.purchasedLands?.length || 0;

        res.json({
            success: true,
            data: {
                ...customer.toJSON(),
                stats: { totalPurchases, purchaseCount }
            }
        });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create customer
router.post('/', isAdminOrAgent, upload.single('idProof'), customerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const customerId = await generateCustomerId();

        const customer = await Customer.create({
            ...req.body,
            customerId,
            idProofDocument: req.file ? req.file.path : null
        });

        await logActivity(req.session.user.id, 'create', 'customer', customer.id, `Created customer ${customer.name}`, null, customer.toJSON(), req);

        res.status(201).json({ success: true, data: customer, message: 'Customer created successfully' });
    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update customer
router.put('/:id', isAdminOrAgent, upload.single('idProof'), async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const oldValues = customer.toJSON();
        const updateData = { ...req.body };

        if (req.file) {
            updateData.idProofDocument = req.file.path;
        }

        await customer.update(updateData);

        await logActivity(req.session.user.id, 'update', 'customer', customer.id, `Updated customer ${customer.name}`, oldValues, customer.toJSON(), req);

        res.json({ success: true, data: customer, message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete customer
router.delete('/:id', isAdminOrAgent, async (req, res) => {
    try {
        const customer = await Customer.findByPk(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Check for related transactions
        const transactionCount = await Transaction.count({ where: { customerId: customer.id } });
        if (transactionCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with existing transactions. Mark as inactive instead.'
            });
        }

        const oldValues = customer.toJSON();
        await customer.destroy();

        await logActivity(req.session.user.id, 'delete', 'customer', req.params.id, `Deleted customer ${customer.name}`, oldValues, null, req);

        res.json({ success: true, message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get customer purchase history
router.get('/:id/purchases', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { customerId: req.params.id },
            include: [
                { model: Land, as: 'land' },
                { model: Agent, as: 'agent', attributes: ['id', 'name'] }
            ],
            order: [['transactionDate', 'DESC']]
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
