/**
 * Event Types Routes
 * Handles CRUD operations for event types
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/event-types
 * Get all event types
 */
router.get('/', async (req, res) => {
    try {
        const eventTypes = await db.query(
            'SELECT * FROM event_types ORDER BY created_at DESC'
        );
        res.json(eventTypes);
    } catch (error) {
        console.error('Error fetching event types:', error);
        res.status(500).json({ error: 'Failed to fetch event types' });
    }
});

/**
 * GET /api/event-types/:id
 * Get a single event type by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [eventType] = await db.query(
            'SELECT * FROM event_types WHERE id = ?',
            [id]
        );
        
        if (!eventType) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        res.json(eventType);
    } catch (error) {
        console.error('Error fetching event type:', error);
        res.status(500).json({ error: 'Failed to fetch event type' });
    }
});

/**
 * GET /api/event-types/slug/:slug
 * Get event type by slug (for public booking page)
 */
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const [eventType] = await db.query(
            'SELECT * FROM event_types WHERE slug = ?',
            [slug]
        );
        
        if (!eventType) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        res.json(eventType);
    } catch (error) {
        console.error('Error fetching event type by slug:', error);
        res.status(500).json({ error: 'Failed to fetch event type' });
    }
});

/**
 * POST /api/event-types
 * Create a new event type
 */
router.post('/', async (req, res) => {
    try {
        const { name, slug, duration_minutes, description, color } = req.body;
        
        // Validate required fields
        if (!name || !slug || !duration_minutes) {
            return res.status(400).json({ 
                error: 'Name, slug, and duration_minutes are required' 
            });
        }
        
        // Check if slug already exists
        const [existing] = await db.query(
            'SELECT id FROM event_types WHERE slug = ?',
            [slug]
        );
        
        if (existing) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        
        const result = await db.query(
            `INSERT INTO event_types (name, slug, duration_minutes, description, color)
             VALUES (?, ?, ?, ?, ?)`,
            [name, slug, duration_minutes, description || null, color || '#0069FF']
        );
        
        const [newEventType] = await db.query(
            'SELECT * FROM event_types WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json(newEventType);
    } catch (error) {
        console.error('Error creating event type:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to create event type' });
    }
});

/**
 * PUT /api/event-types/:id
 * Update an event type
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, duration_minutes, description, color } = req.body;
        
        // Check if event type exists
        const [existing] = await db.query(
            'SELECT id FROM event_types WHERE id = ?',
            [id]
        );
        
        if (!existing) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        // If slug is being changed, check if new slug exists
        if (slug && slug !== existing.slug) {
            const [slugExists] = await db.query(
                'SELECT id FROM event_types WHERE slug = ? AND id != ?',
                [slug, id]
            );
            
            if (slugExists) {
                return res.status(400).json({ error: 'Slug already exists' });
            }
        }
        
        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (slug !== undefined) {
            updates.push('slug = ?');
            values.push(slug);
        }
        if (duration_minutes !== undefined) {
            updates.push('duration_minutes = ?');
            values.push(duration_minutes);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (color !== undefined) {
            updates.push('color = ?');
            values.push(color);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(id);
        
        await db.query(
            `UPDATE event_types SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        const [updated] = await db.query(
            'SELECT * FROM event_types WHERE id = ?',
            [id]
        );
        
        res.json(updated);
    } catch (error) {
        console.error('Error updating event type:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        res.status(500).json({ error: 'Failed to update event type' });
    }
});

/**
 * DELETE /api/event-types/:id
 * Delete an event type (cascades to availability and meetings)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if event type exists
        const [existing] = await db.query(
            'SELECT id FROM event_types WHERE id = ?',
            [id]
        );
        
        if (!existing) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        await db.query('DELETE FROM event_types WHERE id = ?', [id]);
        
        res.json({ message: 'Event type deleted successfully' });
    } catch (error) {
        console.error('Error deleting event type:', error);
        res.status(500).json({ error: 'Failed to delete event type' });
    }
});

module.exports = router;
