require('dotenv').config();
const { sequelize, User } = require('../models');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    try {
        console.log('Initializing database...\n');

        // Test connection
        await sequelize.authenticate();
        console.log('✓ Database connection established');

        // Sync all models (force: true will drop and recreate tables)
        await sequelize.sync({ force: true });
        console.log('✓ Database tables created');

        // Create default admin user
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        await User.create({
            username: process.env.ADMIN_USERNAME || 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@gmpromoters.com',
            password: adminPassword,
            fullName: 'System Administrator',
            role: 'admin',
            isActive: true
        });
        console.log('✓ Default admin user created');

        console.log('\n========================================');
        console.log('Database initialization complete!');
        console.log('========================================');
        console.log('\nDefault Login Credentials:');
        console.log(`  Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
        console.log(`  Password: ${adminPassword}`);
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initDatabase();
