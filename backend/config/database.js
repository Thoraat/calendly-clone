/**
 * Database Configuration
 * Establishes connection to MySQL database using connection pooling
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calendly_clone',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Execute a database query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

/**
 * Get a single connection from the pool (for transactions)
 * @returns {Promise} Database connection
 */
async function getConnection() {
    return await pool.getConnection();
}

module.exports = {
    query,
    getConnection,
    pool
};
