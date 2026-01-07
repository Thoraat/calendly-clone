/**
 * Event Types API
 */

import client from './client'

export const getEventTypes = () => client.get('/event-types')

export const getEventType = (id) => client.get(`/event-types/${id}`)

export const getEventTypeBySlug = (slug) => client.get(`/event-types/slug/${slug}`)

export const createEventType = (data) => client.post('/event-types', data)

export const updateEventType = (id, data) => client.put(`/event-types/${id}`, data)

export const deleteEventType = (id) => client.delete(`/event-types/${id}`)
