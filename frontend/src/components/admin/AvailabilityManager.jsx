import React, { useState, useEffect } from 'react'
import * as eventTypesAPI from '../../api/eventTypes'
import * as availabilityAPI from '../../api/availability'
import './AvailabilityManager.css'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const AvailabilityManager = () => {
  const [eventTypes, setEventTypes] = useState([])
  const [selectedEventType, setSelectedEventType] = useState(null)
  const [availability, setAvailability] = useState([])
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEventTypes()
  }, [])

  useEffect(() => {
    if (selectedEventType) {
      loadAvailability()
    }
  }, [selectedEventType])

  const loadEventTypes = async () => {
    try {
      setLoading(true)
      const data = await eventTypesAPI.getEventTypes()
      setEventTypes(data)
      if (data.length > 0 && !selectedEventType) {
        setSelectedEventType(data[0].id)
      }
    } catch (error) {
      alert('Failed to load event types: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    if (!selectedEventType) return
    
    try {
      const data = await availabilityAPI.getAvailability(selectedEventType)
      setAvailability(data)
    } catch (error) {
      alert('Failed to load availability: ' + error.message)
    }
  }

  const handleDayToggle = (dayOfWeek) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.day_of_week === dayOfWeek)
      if (existing) {
        return prev.filter(a => a.day_of_week !== dayOfWeek)
      } else {
        return [...prev, {
          day_of_week: dayOfWeek,
          start_time: '09:00:00',
          end_time: '17:00:00',
          timezone: timezone
        }]
      }
    })
  }

  const handleTimeChange = (dayOfWeek, field, value) => {
    setAvailability(prev => prev.map(avail => {
      if (avail.day_of_week === dayOfWeek) {
        return { ...avail, [field]: value }
      }
      return avail
    }))
  }

  const handleSave = async () => {
    if (!selectedEventType) return
    
    try {
      const formattedAvailability = availability.map(avail => ({
        dayOfWeek: avail.day_of_week,
        startTime: avail.start_time,
        endTime: avail.end_time,
        timezone: avail.timezone || timezone
      }))
      
      await availabilityAPI.saveAvailability(selectedEventType, formattedAvailability)
      alert('Availability saved successfully!')
      await loadAvailability()
    } catch (error) {
      alert('Failed to save availability: ' + error.message)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (eventTypes.length === 0) {
    return (
      <div className="empty-state">
        <p>No event types found. Please create an event type first.</p>
      </div>
    )
  }

  return (
    <div className="availability-manager">
      <div className="section-header">
        <h2>Availability Settings</h2>
      </div>

      <div className="card">
        <div className="form-group">
          <label>Event Type</label>
          <select
            className="input"
            value={selectedEventType || ''}
            onChange={(e) => setSelectedEventType(Number(e.target.value))}
          >
            {eventTypes.map(et => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Timezone</label>
          <select
            className="input"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value)
              setAvailability(prev => prev.map(avail => ({
                ...avail,
                timezone: e.target.value
              })))
            }}
          >
            {Intl.supportedValuesOf('timeZone').map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="availability-schedule">
          <h3>Weekly Schedule</h3>
          <p className="help-text">Select days and set time ranges when you're available</p>
          
          <div className="days-list">
            {DAYS_OF_WEEK.map(day => {
              const dayAvailability = availability.find(a => a.day_of_week === day.value)
              const isEnabled = !!dayAvailability
              
              return (
                <div key={day.value} className="day-row">
                  <div className="day-checkbox">
                    <input
                      type="checkbox"
                      id={`day-${day.value}`}
                      checked={isEnabled}
                      onChange={() => handleDayToggle(day.value)}
                    />
                    <label htmlFor={`day-${day.value}`}>{day.label}</label>
                  </div>
                  
                  {isEnabled && (
                    <div className="day-times">
                      <input
                        type="time"
                        className="input time-input"
                        value={dayAvailability.start_time.substring(0, 5)}
                        onChange={(e) => handleTimeChange(
                          day.value,
                          'start_time',
                          e.target.value + ':00'
                        )}
                      />
                      <span className="time-separator">to</span>
                      <input
                        type="time"
                        className="input time-input"
                        value={dayAvailability.end_time.substring(0, 5)}
                        onChange={(e) => handleTimeChange(
                          day.value,
                          'end_time',
                          e.target.value + ':00'
                        )}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>
              Save Availability
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvailabilityManager
