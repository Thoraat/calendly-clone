/**
 * Booking Routes
 * Handles public booking operations (slot generation, booking creation)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const moment = require('moment-timezone');

/**
 * GET /api/booking/slots/:eventSlug
 * Get available time slots for an event type
 * Query params: date (YYYY-MM-DD), timezone (optional, defaults to UTC)
 */
router.get('/slots/:eventSlug', async (req, res) => {
    try {
        const { eventSlug } = req.params;
        const { date, timezone = 'UTC' } = req.query;
        
        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }
        
        // Get event type
        const [eventType] = await db.query(
            'SELECT * FROM event_types WHERE slug = ?',
            [eventSlug]
        );
        
        if (!eventType) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        // Get availability for this event type
        const availability = await db.query(
            'SELECT * FROM availability WHERE event_type_id = ?',
            [eventType.id]
        );
        
        if (availability.length === 0) {
            return res.json([]); // No availability configured
        }
        
        // Parse the requested date
        const requestedDate = moment.tz(date, timezone);
        const dayOfWeek = requestedDate.day(); // 0 = Sunday, 6 = Saturday
        
        // Find availability for this day of week
        const dayAvailability = availability.filter(
            avail => avail.day_of_week === dayOfWeek
        );
        
        if (dayAvailability.length === 0) {
            return res.json([]); // No availability for this day
        }
        
        // Check for overrides
        const [override] = await db.query(
            `SELECT * FROM availability_overrides 
             WHERE event_type_id = ? AND override_date = ?`,
            [eventType.id, date]
        );
        
        // If override exists and is not available, return empty slots
        if (override && !override.is_available) {
            return res.json([]);
        }
        
        // Get existing bookings for this date (in UTC)
        const startOfDay = requestedDate.clone().startOf('day').utc();
        const endOfDay = requestedDate.clone().endOf('day').utc();
        
        const existingBookings = await db.query(
            `SELECT start_time, end_time FROM meetings 
             WHERE event_type_id = ? 
             AND status = 'scheduled'
             AND start_time >= ? 
             AND start_time < ?`,
            [eventType.id, startOfDay.toDate(), endOfDay.toDate()]
        );
        
        // Generate time slots
        const slots = [];
        const duration = eventType.duration_minutes;
        
        // Use override times if available, otherwise use day availability
        const timeRanges = override && override.is_available && override.start_time && override.end_time
            ? [{ start_time: override.start_time, end_time: override.end_time, timezone: timezone }]
            : dayAvailability;
        
        for (const avail of timeRanges) {
            const availTimezone = avail.timezone || 'UTC';
            
            // Parse start and end times for this day
            const startMoment = moment.tz(
                `${date} ${avail.start_time}`,
                'YYYY-MM-DD HH:mm:ss',
                availTimezone
            );
            const endMoment = moment.tz(
                `${date} ${avail.end_time}`,
                'YYYY-MM-DD HH:mm:ss',
                availTimezone
            );
            
            // Generate slots in the requested timezone
            let currentSlot = startMoment.clone();
            
            while (currentSlot.clone().add(duration, 'minutes').isSameOrBefore(endMoment)) {
                const slotStart = currentSlot.clone();
                const slotEnd = currentSlot.clone().add(duration, 'minutes');
                
                // Convert to UTC for comparison with existing bookings
                const slotStartUTC = slotStart.clone().utc();
                const slotEndUTC = slotEnd.clone().utc();
                
                // Check if this slot conflicts with existing bookings
                const hasConflict = existingBookings.some(booking => {
                    const bookingStart = moment.utc(booking.start_time);
                    const bookingEnd = moment.utc(booking.end_time);
                    
                    // Check for overlap
                    return (slotStartUTC.isBefore(bookingEnd) && slotEndUTC.isAfter(bookingStart));
                });
                
                // Don't show past slots
                const isPast = slotStartUTC.isBefore(moment.utc());
                
                if (!hasConflict && !isPast) {
                    slots.push({
                        start: slotStart.format('YYYY-MM-DDTHH:mm:ss'),
                        end: slotEnd.format('YYYY-MM-DDTHH:mm:ss'),
                        timezone: timezone
                    });
                }
                
                currentSlot.add(duration, 'minutes');
            }
        }
        
        // Sort slots by start time
        slots.sort((a, b) => moment(a.start).diff(moment(b.start)));
        
        res.json(slots);
    } catch (error) {
        console.error('Error generating slots:', error);
        res.status(500).json({ error: 'Failed to generate time slots' });
    }
});

/**
 * POST /api/booking
 * Create a new booking
 */
router.post('/', async (req, res) => {
    try {
        const { eventSlug, inviteeName, inviteeEmail, startTime, timezone } = req.body;
        
        // Validate required fields
        if (!eventSlug || !inviteeName || !inviteeEmail || !startTime || !timezone) {
            return res.status(400).json({ 
                error: 'eventSlug, inviteeName, inviteeEmail, startTime, and timezone are required' 
            });
        }
        
        // Get event type
        const [eventType] = await db.query(
            'SELECT * FROM event_types WHERE slug = ?',
            [eventSlug]
        );
        
        if (!eventType) {
            return res.status(404).json({ error: 'Event type not found' });
        }
        
        // Parse start time and calculate end time
        const startMoment = moment.tz(startTime, timezone);
        const endMoment = startMoment.clone().add(eventType.duration_minutes, 'minutes');
        
        // Convert to UTC for storage
        const startTimeUTC = startMoment.utc().toDate();
        const endTimeUTC = endMoment.utc().toDate();
        
        // Check for double booking
        // Two time ranges overlap if: start1 < end2 AND start2 < end1
        const conflictingBookings = await db.query(
            `SELECT id FROM meetings 
             WHERE event_type_id = ? 
             AND status = 'scheduled'
             AND start_time < ? 
             AND end_time > ?`,
            [
                eventType.id,
                endTimeUTC,
                startTimeUTC
            ]
        );
        
        if (conflictingBookings.length > 0) {
            return res.status(409).json({ 
                error: 'This time slot is already booked' 
            });
        }
        
        // Create the booking
        const result = await db.query(
            `INSERT INTO meetings 
             (event_type_id, invitee_name, invitee_email, start_time, end_time, timezone, status)
             VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
            [
                eventType.id,
                inviteeName,
                inviteeEmail,
                startTimeUTC,
                endTimeUTC,
                timezone
            ]
        );
        
        // Fetch the created meeting
        const [meeting] = await db.query(
            `SELECT m.*, et.name as event_type_name, et.slug as event_type_slug
             FROM meetings m
             JOIN event_types et ON m.event_type_id = et.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json(meeting);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

module.exports = router;
