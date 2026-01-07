/**
 * Database Configuration
 * Establishes connection to MySQL database using connection pooling
 * Supports both Railway (DATABASE_URL) and standard environment variables
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Parse Railway DATABASE_URL if available, otherwise use individual env vars
let dbConfig;

if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
    // Railway provides connection string in format: mysql://user:password@host:port/database
    const url = process.env.DATABASE_URL || process.env.MYSQL_URL;
    const urlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(urlPattern);
    
    if (match) {
        dbConfig = {
            host: match[3],
            user: match[1],
            password: match[2],
            database: match[5],
            port: parseInt(match[4], 10),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };
    } else {
        console.error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
    }
}

// Fallback to individual environment variables if DATABASE_URL not available
if (!dbConfig) {
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'calendly_clone',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
}

// Log connection config (without password) for debugging
console.log('Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    hasPassword: !!dbConfig.password
});

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Test connection on startup
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connection successful');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Database connection failed:', error.message);
        console.error('Full error:', error);
    });

/**
 * Execute a database query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
async function query(sql, params) {
    try {
        const [results] = await pool.execute(sql, params || []);
        return results;
    } catch (error) {
        // Enhanced error logging for production debugging
        console.error('Database query error:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sql: sql.substring(0, 100), // Log first 100 chars of query
            params: params ? params.length : 0
        });
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
