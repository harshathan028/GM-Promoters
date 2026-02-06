const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    transactionId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'),
        defaultValue: 'cash'
    },
    paymentType: {
        type: DataTypes.ENUM('full', 'installment', 'advance', 'token'),
        defaultValue: 'full'
    },
    installmentNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    totalInstallments: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    transactionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    receiptNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    receiptFile: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Path to receipt file'
    },
    chequeNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    chequeDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    bankReference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'completed'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    commissionAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    commissionPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'transactions',
    timestamps: true
});

module.exports = Transaction;
