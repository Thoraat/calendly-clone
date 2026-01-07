/**
 * Booking API
 */

import client from './client'

export const getAvailableSlots = (eventSlug, date, timezone = 'UTC') =>
  client.get(`/booking/slots/${eventSlug}`, {
    params: { date, timezone }
  })

export const createBooking = (data) =>
  client.post('/booking', data)
