const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'create, update, delete, login, logout, etc.'
    },
    entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'land, customer, agent, transaction, user'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    oldValues: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('oldValues');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('oldValues', value ? JSON.stringify(value) : null);
        }
    },
    newValues: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('newValues');
            return rawValue ? JSON.parse(rawValue) : null;
        },
        set(value) {
            this.setDataValue('newValues', value ? JSON.stringify(value) : null);
        }
    },
    ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'activity_logs',
    timestamps: true,
    updatedAt: false
});

module.exports = ActivityLog;
