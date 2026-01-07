/**
 * Availability Routes
 * Handles availability settings for event types
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/availability/:eventTypeId
 * Get all availability settings for an event type
 */
router.get('/:eventTypeId', async (req, res) => {
    try {
        const { eventTypeId } = req.params;
        
        const availability = await db.query(
            `SELECT * FROM availability 
             WHERE event_type_id = ? 
             ORDER BY day_of_week, start_time`,
            [eventTypeId]
        );
        
        res.json(availability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ error: 'Failed to fetch availability' });
    }
});

/**
 * POST /api/availability
 * Create or update availability settings
 * Accepts array of availability objects
 */
router.post('/', async (req, res) => {
    try {
        const { eventTypeId, availability } = req.body;
        
        if (!eventTypeId || !Array.isArray(availability)) {
            return res.status(400).json({ 
                error: 'eventTypeId and availability array are required' 
            });
        }
        
        // Verify event type exists
        const [eventType] = await db.query(
            'SELECT id FROM event_types WHERE id = ?',
            [eventTypeId]
        );
        
        if (!eventType) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        const connection = await db.getConnection();
        await connection.beginTransaction();
        
        try {
            // Delete existing availability for this event type
            await connection.execute(
                'DELETE FROM availability WHERE event_type_id = ?',
                [eventTypeId]
            );
            
            // Insert new availability records
            for (const avail of availability) {
                const { dayOfWeek, startTime, endTime, timezone } = avail;
                
                if (dayOfWeek === undefined || !startTime || !endTime) {
                    throw new Error('Invalid availability data');
                }
                
                await connection.execute(
                    `INSERT INTO availability 
                     (event_type_id, day_of_week, start_time, end_time, timezone)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        eventTypeId,
                        dayOfWeek,
                        startTime,
                        endTime,
                        timezone || 'UTC'
                    ]
                );
            }
            
            await connection.commit();
            
            // Fetch and return updated availability
            const [updated] = await connection.execute(
                `SELECT * FROM availability 
                 WHERE event_type_id = ? 
                 ORDER BY day_of_week, start_time`,
                [eventTypeId]
            );
            
            res.json(updated);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error saving availability:', error);
        res.status(500).json({ error: 'Failed to save availability' });
    }
});

/**
 * DELETE /api/availability/:eventTypeId
 * Delete all availability for an event type
 */
router.delete('/:eventTypeId', async (req, res) => {
    try {
        const { eventTypeId } = req.params;
        
        await db.query(
            'DELETE FROM availability WHERE event_type_id = ?',
            [eventTypeId]
        );
        
        res.json({ message: 'Availability deleted successfully' });
    } catch (error) {
        console.error('Error deleting availability:', error);
        res.status(500).json({ error: 'Failed to delete availability' });
    }
});

module.exports = router;
