/**
 * Meetings Routes
 * Handles meeting operations (list, cancel, create)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/meetings
 * Get all meetings with optional filters
 * Query params: status (scheduled/cancelled/completed), upcoming (true/false)
 */
router.get('/', async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        
        let query = `
            SELECT m.*, et.name as event_type_name, et.slug as event_type_slug
            FROM meetings m
            JOIN event_types et ON m.event_type_id = et.id
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }
        
        if (upcoming === 'true') {
            query += ' AND m.start_time > NOW() AND m.status = "scheduled"';
        } else if (upcoming === 'false') {
            query += ' AND m.start_time <= NOW()';
        }
        
        query += ' ORDER BY m.start_time DESC';
        
        const meetings = await db.query(query, params);
        res.json(meetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
});

/**
 * GET /api/meetings/:id
 * Get a single meeting by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [meeting] = await db.query(
            `SELECT m.*, et.name as event_type_name, et.slug as event_type_slug
             FROM meetings m
             JOIN event_types et ON m.event_type_id = et.id
             WHERE m.id = ?`,
            [id]
        );
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        
        res.json(meeting);
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: 'Failed to fetch meeting' });
    }
});

/**
 * PATCH /api/meetings/:id/cancel
 * Cancel a meeting
 */
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if meeting exists
        const [meeting] = await db.query(
            'SELECT * FROM meetings WHERE id = ?',
            [id]
        );
        
        if (!meeting) {
            return res.status(404).json({ error: 'Meeting not found' });
        }
        
        if (meeting.status === 'cancelled') {
            return res.status(400).json({ error: 'Meeting is already cancelled' });
        }
        
        await db.query(
            'UPDATE meetings SET status = "cancelled" WHERE id = ?',
            [id]
        );
        
        const [updated] = await db.query(
            'SELECT * FROM meetings WHERE id = ?',
            [id]
        );
        
        res.json(updated);
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        res.status(500).json({ error: 'Failed to cancel meeting' });
    }
});

module.exports = router;
