/**
 * Meetings API
 */

import client from './client'

export const getMeetings = (params = {}) => {
  const queryString = new URLSearchParams(params).toString()
  return client.get(`/meetings${queryString ? `?${queryString}` : ''}`)
}

export const getMeeting = (id) => client.get(`/meetings/${id}`)

export const cancelMeeting = (id) => client.patch(`/meetings/${id}/cancel`)
