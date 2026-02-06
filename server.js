require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const landRoutes = require('./routes/lands');
const customerRoutes = require('./routes/customers');
const agentRoutes = require('./routes/agents');
const transactionRoutes = require('./routes/transactions');
const reportRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search');
const userRoutes = require('./routes/users');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const dirs = ['./database', './uploads', './uploads/documents', './uploads/receipts', './uploads/id_proofs', './uploads/images'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'gm-promoters-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lands', landRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connected');

        await sequelize.sync({ alter: false });
        console.log('✓ Database synchronized');

        app.listen(PORT, () => {
            console.log(`\n🚀 GM Promoters Land Management System`);
            console.log(`   Server running on http://localhost:${PORT}`);
            console.log(`   Database: ${process.env.DB_TYPE || 'sqlite'}\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
