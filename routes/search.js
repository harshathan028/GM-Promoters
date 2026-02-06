const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Land, Customer, Agent, Transaction } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Global search across all entities
router.get('/', async (req, res) => {
    try {
        const { q, type, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({ success: true, data: { lands: [], customers: [], agents: [] } });
        }

        const searchLimit = parseInt(limit);
        const results = {};

        if (!type || type === 'lands') {
            results.lands = await Land.findAll({
                where: {
                    [Op.or]: [
                        { landId: { [Op.like]: `%${q}%` } },
                        { location: { [Op.like]: `%${q}%` } },
                        { surveyNumber: { [Op.like]: `%${q}%` } }
                    ]
                },
                attributes: ['id', 'landId', 'location', 'price', 'status'],
                limit: searchLimit
            });
        }

        if (!type || type === 'customers') {
            results.customers = await Customer.findAll({
                where: {
                    [Op.or]: [
                        { customerId: { [Op.like]: `%${q}%` } },
                        { name: { [Op.like]: `%${q}%` } },
                        { phone: { [Op.like]: `%${q}%` } },
                        { email: { [Op.like]: `%${q}%` } }
                    ]
                },
                attributes: ['id', 'customerId', 'name', 'phone', 'email'],
                limit: searchLimit
            });
        }

        if (!type || type === 'agents') {
            results.agents = await Agent.findAll({
                where: {
                    [Op.or]: [
                        { agentId: { [Op.like]: `%${q}%` } },
                        { name: { [Op.like]: `%${q}%` } },
                        { phone: { [Op.like]: `%${q}%` } }
                    ]
                },
                attributes: ['id', 'agentId', 'name', 'phone'],
                limit: searchLimit
            });
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Advanced land search with filters
router.get('/lands', async (req, res) => {
    try {
        const {
            minPrice, maxPrice, minArea, maxArea,
            location, landType, status,
            page = 1, limit = 20
        } = req.query;

        const where = {};

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
        }

        if (minArea || maxArea) {
            where.areaSize = {};
            if (minArea) where.areaSize[Op.gte] = parseFloat(minArea);
            if (maxArea) where.areaSize[Op.lte] = parseFloat(maxArea);
        }

        if (location) where.location = { [Op.like]: `%${location}%` };
        if (landType) where.landType = landType;
        if (status) where.status = status;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows, count } = await Land.findAndCountAll({
            where,
            include: [{ model: Agent, as: 'primaryAgent', attributes: ['name'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.json({
            success: true,
            data: rows,
            pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) }
        });
    } catch (error) {
        console.error('Land search error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
