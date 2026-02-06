const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const { Land, Customer, Agent, Transaction } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Export lands to CSV
router.get('/lands', async (req, res) => {
    try {
        const lands = await Land.findAll({
            include: [{ model: Agent, as: 'primaryAgent', attributes: ['name'] }],
            raw: true,
            nest: true
        });

        const fields = ['landId', 'location', 'areaSize', 'areaUnit', 'price', 'surveyNumber', 'landType', 'status', 'description', 'createdAt'];
        const parser = new Parser({ fields });
        const csv = parser.parse(lands);

        res.header('Content-Type', 'text/csv');
        res.attachment('lands_export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// Export customers to CSV
router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.findAll({ raw: true });
        const fields = ['customerId', 'name', 'phone', 'email', 'address', 'city', 'state', 'pincode', 'createdAt'];
        const parser = new Parser({ fields });
        const csv = parser.parse(customers);

        res.header('Content-Type', 'text/csv');
        res.attachment('customers_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// Export agents to CSV
router.get('/agents', async (req, res) => {
    try {
        const agents = await Agent.findAll({ raw: true });
        const fields = ['agentId', 'name', 'phone', 'email', 'commissionPercent', 'totalSales', 'totalCommissionEarned', 'joiningDate'];
        const parser = new Parser({ fields });
        const csv = parser.parse(agents);

        res.header('Content-Type', 'text/csv');
        res.attachment('agents_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

// Export transactions to CSV
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            include: [
                { model: Land, as: 'land', attributes: ['landId', 'location'] },
                { model: Customer, as: 'customer', attributes: ['name'] },
                { model: Agent, as: 'agent', attributes: ['name'] }
            ],
            raw: true,
            nest: true
        });

        const data = transactions.map(t => ({
            transactionId: t.transactionId,
            landId: t.land?.landId,
            location: t.land?.location,
            customer: t.customer?.name,
            agent: t.agent?.name,
            amount: t.amount,
            paymentMethod: t.paymentMethod,
            paymentType: t.paymentType,
            status: t.status,
            transactionDate: t.transactionDate,
            commissionAmount: t.commissionAmount
        }));

        const parser = new Parser();
        const csv = parser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment('transactions_export.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

module.exports = router;
