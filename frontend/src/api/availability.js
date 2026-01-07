/**
 * Availability API
 */

import client from './client'

export const getAvailability = (eventTypeId) => 
  client.get(`/availability/${eventTypeId}`)

export const saveAvailability = (eventTypeId, availability) =>
  client.post('/availability', { eventTypeId, availability })

export const deleteAvailability = (eventTypeId) =>
  client.delete(`/availability/${eventTypeId}`)
