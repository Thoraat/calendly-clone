/**
 * Database Configuration
 * Establishes connection to MySQL database using connection pooling
 * Supports both Railway (DATABASE_URL/MYSQL_URL) and standard environment variables
 * 
 * Priority order:
 * 1. Railway DATABASE_URL or MYSQL_URL (production)
 * 2. Individual DB_* environment variables (development/fallback)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Parse MySQL connection URL from Railway
 * Handles formats:
 * - mysql://user:password@host:port/database
 * - mysql://user:password@host:port/database?ssl=true
 * - Handles URL-encoded passwords and special characters
 */
function parseDatabaseUrl(url) {
    if (!url) return null;
    
    try {
        // Use Node's built-in URL parser for more robust parsing
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (urlError) {
            // URL constructor failed, fallback to regex parsing
            parsedUrl = null;
        }
        
        // If URL constructor succeeded, use it
        if (parsedUrl) {
            const host = parsedUrl.hostname;
            const port = parsedUrl.port || 3306;
            const user = decodeURIComponent(parsedUrl.username);
            const password = decodeURIComponent(parsedUrl.password);
            const database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, '')); // Remove leading /
            
            // Check for SSL requirement
            const hasSSL = parsedUrl.searchParams.get('ssl') === 'true' || process.env.NODE_ENV === 'production';
            
            return {
                host: host.trim(),
                user: user.trim(),
                password: password.trim(),
                database: database.trim(),
                port: parseInt(port, 10),
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                // ssl: hasSSL ? { rejectUnauthorized: false } : false
                ssl: {
                    rejectUnauthorized: false
                }
            };
        }
        
        // Fallback to regex if URL constructor failed
        const urlPattern = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
        const match = url.match(urlPattern);
        
        if (!match) {
            console.error('❌ Invalid DATABASE_URL format:', url.substring(0, 50) + '...');
            return null;
        }
        
        const [, user, password, host, port, database] = match;
        
        // Decode URL-encoded characters
        const decodedPassword = decodeURIComponent(password);
        
        // Check for SSL requirement in query params or default for production
        const hasSSL = url.includes('ssl=true') || process.env.NODE_ENV === 'production';
        
        return {
            host: host.trim(),
            user: decodeURIComponent(user.trim()),
            password: decodedPassword,
            database: decodeURIComponent(database.trim()),
            port: parseInt(port, 10),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            // ssl: hasSSL ? { rejectUnauthorized: false } : false
            ssl: {
                rejectUnauthorized: false
            }
            
        };
    } catch (error) {
        console.error('❌ Error parsing DATABASE_URL:', error.message);
        console.error('❌ URL (first 100 chars):', url.substring(0, 100));
        return null;
    }
}

/**
 * Build database configuration from environment variables
 * Priority: Railway URL > Individual variables > Defaults
 */
function buildDbConfig() {
    let dbConfig = null;
    let configSource = 'unknown';
    
    // Priority 1: Railway DATABASE_URL or MYSQL_URL
    const railwayUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
    if (railwayUrl) {
        console.log('🔍 Found Railway connection URL (DATABASE_URL/MYSQL_URL)');
        dbConfig = parseDatabaseUrl(railwayUrl);
        if (dbConfig) {
            configSource = 'railway-url';
        }
    }
    
    // Priority 2: Individual environment variables (development/fallback)
    if (!dbConfig) {
        console.log('🔍 Using individual DB environment variables');
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
        configSource = 'env-vars';
    }
    
    // Log configuration source and details (safely, without password)
    console.log('📊 Database Configuration Source:', configSource);
    console.log('📊 Database Config:', {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port,
        hasPassword: !!dbConfig.password,
        hasSSL: !!dbConfig.ssl,
        environment: process.env.NODE_ENV || 'development'
    });
    
    return dbConfig;
}

// Build configuration
const dbConfig = buildDbConfig();

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection on startup (non-blocking, but logs result)
let connectionTested = false;
pool.getConnection()
    .then(connection => {
        connectionTested = true;
        console.log('✅ Database connection pool initialized successfully');
        console.log('✅ Connection test passed');
        connection.release();
    })
    .catch(error => {
        connectionTested = true;
        console.error('❌ Database connection pool initialization failed');
        console.error('❌ Error:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error errno:', error.errno);
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused - Check host/port and ensure MySQL is running');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ Access denied - Check username/password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('❌ Database does not exist - Check database name');
        }
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
