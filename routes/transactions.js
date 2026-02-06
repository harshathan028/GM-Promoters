const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Transaction, Land, Customer, Agent } = require('../models');
const { isAuthenticated, isAdminOrAgent } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');
const upload = require('../middleware/upload');

router.use(isAuthenticated);

// Validation rules
const transactionValidation = [
    body('landId').notEmpty().withMessage('Land is required'),
    body('customerId').notEmpty().withMessage('Customer is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('paymentMethod').isIn(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'])
        .withMessage('Invalid payment method')
];

// Generate transaction ID
const generateTransactionId = async () => {
    const count = await Transaction.count();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `TXN-${date}-${String(count + 1).padStart(4, '0')}`;
};

// Generate receipt number
const generateReceiptNumber = async () => {
    const count = await Transaction.count();
    return `RCP-${String(count + 1).padStart(6, '0')}`;
};

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const {
            search, status, paymentMethod, startDate, endDate,
            landId, customerId, agentId,
            page = 1, limit = 10, sortBy = 'transactionDate', sortOrder = 'DESC'
        } = req.query;

        const where = {};

        if (search) {
            where[Op.or] = [
                { transactionId: { [Op.like]: `%${search}%` } },
                { receiptNumber: { [Op.like]: `%${search}%` } }
            ];
        }
        if (status) where.status = status;
        if (paymentMethod) where.paymentMethod = paymentMethod;
        if (landId) where.landId = landId;
        if (customerId) where.customerId = customerId;
        if (agentId) where.agentId = agentId;
        if (startDate) where.transactionDate = { ...where.transactionDate, [Op.gte]: startDate };
        if (endDate) where.transactionDate = { ...where.transactionDate, [Op.lte]: endDate };

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: transactions, count: total } = await Transaction.findAndCountAll({
            where,
            include: [
                { model: Land, as: 'land', attributes: ['id', 'landId', 'location', 'price'] },
                { model: Customer, as: 'customer', attributes: ['id', 'customerId', 'name', 'phone'] },
                { model: Agent, as: 'agent', attributes: ['id', 'agentId', 'name'] }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single transaction
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                { model: Land, as: 'land' },
                { model: Customer, as: 'customer' },
                { model: Agent, as: 'agent' }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create transaction
router.post('/', isAdminOrAgent, upload.single('receipt'), transactionValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { landId, customerId, agentId, amount } = req.body;

        // Validate land exists
        const land = await Land.findByPk(landId);
        if (!land) {
            return res.status(404).json({ success: false, message: 'Land not found' });
        }

        // Validate customer exists
        const customer = await Customer.findByPk(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Calculate commission if agent assigned
        let commissionAmount = 0;
        if (agentId) {
            const agent = await Agent.findByPk(agentId);
            if (agent) {
                commissionAmount = (parseFloat(amount) * parseFloat(agent.commissionPercent)) / 100;
            }
        }

        const transactionId = await generateTransactionId();
        const receiptNumber = await generateReceiptNumber();

        const transaction = await Transaction.create({
            ...req.body,
            transactionId,
            receiptNumber,
            commissionAmount,
            receiptFile: req.file ? req.file.path : null,
            transactionDate: req.body.transactionDate || new Date()
        });

        // Update land status if full payment
        if (req.body.paymentType === 'full') {
            await land.update({ status: 'sold', purchasedBy: customerId });
        } else if (land.status === 'available') {
            await land.update({ status: 'reserved' });
        }

        // Update agent stats
        if (agentId) {
            await Agent.increment('totalSales', { where: { id: agentId } });
            await Agent.increment('totalCommissionEarned', { by: commissionAmount, where: { id: agentId } });
        }

        await logActivity(req.session.user.id, 'create', 'transaction', transaction.id,
            `Created transaction ${transactionId}`, null, transaction.toJSON(), req);

        const fullTransaction = await Transaction.findByPk(transaction.id, {
            include: [
                { model: Land, as: 'land' },
                { model: Customer, as: 'customer' },
                { model: Agent, as: 'agent' }
            ]
        });

        res.status(201).json({
            success: true,
            data: fullTransaction,
            message: 'Transaction recorded successfully'
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update transaction
router.put('/:id', isAdminOrAgent, upload.single('receipt'), async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const oldValues = transaction.toJSON();
        const updateData = { ...req.body };

        if (req.file) {
            updateData.receiptFile = req.file.path;
        }

        // Recalculate commission if amount or agent changed
        if (updateData.amount || updateData.agentId) {
            const agentId = updateData.agentId || transaction.agentId;
            if (agentId) {
                const agent = await Agent.findByPk(agentId);
                if (agent) {
                    const amount = parseFloat(updateData.amount || transaction.amount);
                    updateData.commissionAmount = (amount * parseFloat(agent.commissionPercent)) / 100;
                }
            }
        }

        await transaction.update(updateData);

        await logActivity(req.session.user.id, 'update', 'transaction', transaction.id,
            `Updated transaction ${transaction.transactionId}`, oldValues, transaction.toJSON(), req);

        res.json({ success: true, data: transaction, message: 'Transaction updated successfully' });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete transaction
router.delete('/:id', isAdminOrAgent, async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        const oldValues = transaction.toJSON();
        await transaction.destroy();

        await logActivity(req.session.user.id, 'delete', 'transaction', req.params.id,
            `Deleted transaction ${transaction.transactionId}`, oldValues, null, req);

        res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get receipt view data
router.get('/:id/receipt', async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id, {
            include: [
                { model: Land, as: 'land' },
                { model: Customer, as: 'customer' },
                { model: Agent, as: 'agent' }
            ]
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Get receipt error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mark commission as paid
router.post('/:id/pay-commission', isAdminOrAgent, async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        await transaction.update({ commissionPaid: true });

        await logActivity(req.session.user.id, 'update', 'transaction', transaction.id,
            `Marked commission paid for ${transaction.transactionId}`, null, null, req);

        res.json({ success: true, message: 'Commission marked as paid' });
    } catch (error) {
        console.error('Pay commission error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get payment tracking for a land
router.get('/land/:landId/payments', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: { landId: req.params.landId },
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'phone'] }],
            order: [['transactionDate', 'ASC']]
        });

        const land = await Land.findByPk(req.params.landId);
        const totalPaid = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        const balance = land ? parseFloat(land.price) - totalPaid : 0;

        res.json({
            success: true,
            data: {
                transactions,
                summary: {
                    landPrice: land?.price || 0,
                    totalPaid,
                    balance,
                    paymentCount: transactions.length
                }
            }
        });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
