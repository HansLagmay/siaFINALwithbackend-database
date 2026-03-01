require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function createSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '../server/sql/schema.sql'), 'utf8');
    console.log('Creating schema...');
    await connection.query(sql);
    console.log('✅ Schema created successfully');
  } catch (err) {
    console.error('❌ Failed to create schema:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createSchema();
