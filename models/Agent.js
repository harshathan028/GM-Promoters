const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agent = sequelize.define('Agent', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    agentId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    commissionPercent: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 2.00,
        validate: {
            min: 0,
            max: 100
        }
    },
    joiningDate: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    totalSales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    totalCommissionEarned: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    bankAccountName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    bankAccountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    ifscCode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'agents',
    timestamps: true
});

module.exports = Agent;
