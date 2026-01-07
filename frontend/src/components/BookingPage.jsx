import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as eventTypesAPI from '../api/eventTypes'
import * as bookingAPI from '../api/booking'
import moment from 'moment-timezone'
import './BookingPage.css'

const BookingPage = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [eventType, setEventType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [bookingData, setBookingData] = useState(null)

  useEffect(() => {
    loadEventType()
  }, [slug])

  useEffect(() => {
    if (eventType && selectedDate) {
      loadAvailableSlots()
    }
  }, [eventType, selectedDate, timezone])

  const loadEventType = async () => {
    try {
      setLoading(true)
      const data = await eventTypesAPI.getEventTypeBySlug(slug)
      setEventType(data)
    } catch (error) {
      alert('Event type not found: ' + error.message)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      const slots = await bookingAPI.getAvailableSlots(slug, selectedDate, timezone)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Failed to load slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleBooking = async (e) => {
    e.preventDefault()
    if (!selectedSlot) return

    try {
      const booking = await bookingAPI.createBooking({
        eventSlug: slug,
        inviteeName: formData.name,
        inviteeEmail: formData.email,
        startTime: selectedSlot.start,
        timezone: timezone
      })
      
      setBookingData(booking)
      setBookingConfirmed(true)
    } catch (error) {
      alert('Failed to create booking: ' + error.message)
    }
  }

  const renderCalendar = () => {
    const startDate = moment(selectedDate).startOf('month').startOf('week')
    const endDate = moment(selectedDate).endOf('month').endOf('week')
    const days = []
    const current = startDate.clone()

    while (current.isSameOrBefore(endDate, 'day')) {
      days.push(current.clone())
      current.add(1, 'day')
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = moment()

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button
            className="calendar-nav-btn"
            onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'month').format('YYYY-MM-DD'))}
          >
            ‹
          </button>
          <h3>{moment(selectedDate).format('MMMM YYYY')}</h3>
          <button
            className="calendar-nav-btn"
            onClick={() => setSelectedDate(moment(selectedDate).add(1, 'month').format('YYYY-MM-DD'))}
          >
            ›
          </button>
        </div>
        
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {days.map(day => {
            const isCurrentMonth = day.month() === moment(selectedDate).month()
            const isToday = day.isSame(today, 'day')
            const isSelected = day.isSame(moment(selectedDate), 'day')
            const isPast = day.isBefore(today, 'day')

            return (
              <button
                key={day.format('YYYY-MM-DD')}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
                onClick={() => !isPast && isCurrentMonth && handleDateChange(day.format('YYYY-MM-DD'))}
                disabled={isPast || !isCurrentMonth}
              >
                {day.format('D')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="booking-page loading">Loading...</div>
  }

  if (bookingConfirmed && bookingData) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="booking-confirmation">
            <div className="confirmation-icon">✓</div>
            <h1>You're scheduled!</h1>
            <p className="confirmation-message">
              A calendar invitation has been sent to your email address.
            </p>
            
            <div className="confirmation-details">
              <div className="detail-row">
                <strong>Event:</strong> {bookingData.event_type_name}
              </div>
              <div className="detail-row">
                <strong>Date & Time:</strong>{' '}
                {moment.utc(bookingData.start_time).tz(bookingData.timezone).format('MMMM D, YYYY [at] h:mm A z')}
              </div>
              <div className="detail-row">
                <strong>Duration:</strong>{' '}
                {moment(bookingData.end_time).diff(moment(bookingData.start_time), 'minutes')} minutes
              </div>
              <div className="detail-row">
                <strong>Invitee:</strong> {bookingData.invitee_name}
              </div>
            </div>
            
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h1>{eventType?.name}</h1>
          <p className="event-duration">{eventType?.duration_minutes} min</p>
          {eventType?.description && (
            <p className="event-description">{eventType.description}</p>
          )}
        </div>

        <div className="booking-content">
          <div className="booking-section">
            <h2>Select a date & time</h2>
            
            <div className="timezone-selector">
              <label>Timezone:</label>
              <select
                className="input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {Intl.supportedValuesOf('timeZone').map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {renderCalendar()}

            <div className="time-slots">
              <h3>{moment(selectedDate).format('dddd, MMMM D')}</h3>
              {loadingSlots ? (
                <div className="loading-slots">Loading available times...</div>
              ) : availableSlots.length === 0 ? (
                <div className="no-slots">No available times for this date.</div>
              ) : (
                <div className="slots-grid">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={`time-slot ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {moment(slot.start).format('h:mm A')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedSlot && (
            <div className="booking-section booking-form-section">
              <h2>Enter details</h2>
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  Confirm
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingPage
