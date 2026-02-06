const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerId: {
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
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    pincode: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    idProofType: {
        type: DataTypes.ENUM('aadhar', 'pan', 'passport', 'voter_id', 'driving_license', 'other'),
        allowNull: true
    },
    idProofNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    idProofDocument: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'File path to uploaded ID proof'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'customers',
    timestamps: true
});

module.exports = Customer;
