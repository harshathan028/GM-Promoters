require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DB_TYPE === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // SQLite fallback
  const dbPath = path.resolve(process.env.SQLITE_PATH || './database/gm_promoters.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
}

module.exports = sequelize;
