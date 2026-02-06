const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Land = sequelize.define('Land', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    landId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    areaSize: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Area in square feet or acres'
    },
    areaUnit: {
        type: DataTypes.ENUM('sqft', 'acres', 'hectares'),
        defaultValue: 'sqft'
    },
    price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    surveyNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    landType: {
        type: DataTypes.ENUM('residential', 'commercial', 'agricultural', 'industrial', 'mixed'),
        defaultValue: 'residential'
    },
    status: {
        type: DataTypes.ENUM('available', 'reserved', 'sold'),
        defaultValue: 'available'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    documents: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('documents');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('documents', JSON.stringify(value || []));
        }
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('images');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('images', JSON.stringify(value || []));
        }
    },
    coordinates: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'GPS coordinates'
    },
    features: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of features'
    }
}, {
    tableName: 'lands',
    timestamps: true
});

module.exports = Land;
