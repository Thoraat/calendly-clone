/**
 * Express Server
 * Main entry point for the Calendly Clone API
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/event-types', require('./routes/eventTypes'));
app.use('/api/availability', require('./routes/availability'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/booking', require('./routes/booking'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await db.query('SELECT 1 as test');
        res.json({ 
            status: 'ok', 
            message: 'Calendly Clone API is running',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check failed:', error.message);
        res.status(503).json({ 
            status: 'error', 
            message: 'API is running but database connection failed',
            database: 'disconnected',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });
    
    const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Internal server error: ${err.message}` 
        : 'Internal server error';
    
    res.status(500).json({ 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { details: err.message, stack: err.stack })
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    
    // Log database connection status
    db.pool.getConnection()
        .then(connection => {
            console.log('✅ Database connection pool ready');
            connection.release();
        })
        .catch(error => {
            console.error('❌ Database connection pool error:', error.message);
        });
});

module.exports = app;
