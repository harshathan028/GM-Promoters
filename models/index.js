const sequelize = require('../config/database');
const User = require('./User');
const Land = require('./Land');
const Customer = require('./Customer');
const Agent = require('./Agent');
const Transaction = require('./Transaction');
const AgentLandAssignment = require('./AgentLandAssignment');
const ActivityLog = require('./ActivityLog');

// Define relationships

// Land - Agent (Many-to-Many through AgentLandAssignment)
Land.belongsToMany(Agent, {
    through: AgentLandAssignment,
    foreignKey: 'landId',
    otherKey: 'agentId',
    as: 'assignedAgents'
});

Agent.belongsToMany(Land, {
    through: AgentLandAssignment,
    foreignKey: 'agentId',
    otherKey: 'landId',
    as: 'assignedLands'
});

// Land - Primary Agent (direct relationship for the current main agent)
Land.belongsTo(Agent, {
    foreignKey: 'primaryAgentId',
    as: 'primaryAgent'
});

Agent.hasMany(Land, {
    foreignKey: 'primaryAgentId',
    as: 'primaryLands'
});

// Transaction relationships
Transaction.belongsTo(Land, {
    foreignKey: 'landId',
    as: 'land'
});

Land.hasMany(Transaction, {
    foreignKey: 'landId',
    as: 'transactions'
});

Transaction.belongsTo(Customer, {
    foreignKey: 'customerId',
    as: 'customer'
});

Customer.hasMany(Transaction, {
    foreignKey: 'customerId',
    as: 'transactions'
});

Transaction.belongsTo(Agent, {
    foreignKey: 'agentId',
    as: 'agent'
});

Agent.hasMany(Transaction, {
    foreignKey: 'agentId',
    as: 'transactions'
});

// Land - Customer (for purchased lands)
Land.belongsTo(Customer, {
    foreignKey: 'purchasedBy',
    as: 'buyer'
});

Customer.hasMany(Land, {
    foreignKey: 'purchasedBy',
    as: 'purchasedLands'
});

// Activity Log - User relationship
ActivityLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

User.hasMany(ActivityLog, {
    foreignKey: 'userId',
    as: 'activities'
});

// User - Agent relationship (optional: link user account to agent profile)
User.belongsTo(Agent, {
    foreignKey: 'agentId',
    as: 'agentProfile'
});

Agent.hasOne(User, {
    foreignKey: 'agentId',
    as: 'userAccount'
});

module.exports = {
    sequelize,
    User,
    Land,
    Customer,
    Agent,
    Transaction,
    AgentLandAssignment,
    ActivityLog
};
