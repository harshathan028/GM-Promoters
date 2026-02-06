const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AgentLandAssignment = sequelize.define('AgentLandAssignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assignmentDate: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'agent_land_assignments',
    timestamps: true
});

module.exports = AgentLandAssignment;
