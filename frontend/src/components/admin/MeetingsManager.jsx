import React, { useState, useEffect } from 'react'
import * as meetingsAPI from '../../api/meetings'
import moment from 'moment-timezone'
import './MeetingsManager.css'

const MeetingsManager = () => {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past

  useEffect(() => {
    loadMeetings()
  }, [filter])

  const loadMeetings = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filter === 'upcoming') {
        params.upcoming = 'true'
        params.status = 'scheduled'
      } else if (filter === 'past') {
        params.upcoming = 'false'
      }
      
      const data = await meetingsAPI.getMeetings(params)
      setMeetings(data)
    } catch (error) {
      alert('Failed to load meetings: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) {
      return
    }
    
    try {
      await meetingsAPI.cancelMeeting(id)
      await loadMeetings()
      alert('Meeting cancelled successfully')
    } catch (error) {
      alert('Failed to cancel meeting: ' + error.message)
    }
  }

  const formatDateTime = (dateTime, timezone) => {
    return moment.tz(dateTime, 'UTC').tz(timezone).format('MMM D, YYYY [at] h:mm A z')
  }

  if (loading) {
    return <div className="loading">Loading meetings...</div>
  }

  return (
    <div className="meetings-manager">
      <div className="section-header">
        <h2>Meetings</h2>
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={filter === 'past' ? 'active' : ''}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>
      </div>

      <div className="meetings-list">
        {meetings.length === 0 ? (
          <div className="empty-state">
            <p>No meetings found.</p>
          </div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="card meeting-card">
              <div className="meeting-header">
                <div className="meeting-info">
                  <h3>{meeting.event_type_name}</h3>
                  <p className="meeting-meta">
                    {formatDateTime(meeting.start_time, meeting.timezone)}
                  </p>
                  <p className="meeting-duration">
                    Duration: {moment(meeting.end_time).diff(moment(meeting.start_time), 'minutes')} minutes
                  </p>
                </div>
                <div className={`meeting-status status-${meeting.status}`}>
                  {meeting.status}
                </div>
              </div>
              
              <div className="meeting-details">
                <div className="detail-item">
                  <strong>Invitee:</strong> {meeting.invitee_name}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {meeting.invitee_email}
                </div>
                <div className="detail-item">
                  <strong>Booking URL:</strong>{' '}
                  <a
                    href={`/book/${meeting.event_type_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    /book/{meeting.event_type_slug}
                  </a>
                </div>
              </div>

              {meeting.status === 'scheduled' && moment(meeting.start_time).isAfter(moment()) && (
                <div className="meeting-actions">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleCancel(meeting.id)}
                  >
                    Cancel Meeting
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MeetingsManager
