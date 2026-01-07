import React, { useState, useEffect } from 'react'
import * as eventTypesAPI from '../../api/eventTypes'
import './EventTypesManager.css'

const EventTypesManager = () => {
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    duration_minutes: 30,
    description: '',
    color: '#0069FF'
  })

  useEffect(() => {
    loadEventTypes()
  }, [])

  const loadEventTypes = async () => {
    try {
      setLoading(true)
      const data = await eventTypesAPI.getEventTypes()
      setEventTypes(data)
    } catch (error) {
      alert('Failed to load event types: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-generate slug from name if not editing
      if (name === 'name' && !editingEvent) {
        updated.slug = generateSlug(value)
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await eventTypesAPI.updateEventType(editingEvent.id, formData)
      } else {
        await eventTypesAPI.createEventType(formData)
      }
      await loadEventTypes()
      resetForm()
    } catch (error) {
      alert('Failed to save event type: ' + error.message)
    }
  }

  const handleEdit = (eventType) => {
    setEditingEvent(eventType)
    setFormData({
      name: eventType.name,
      slug: eventType.slug,
      duration_minutes: eventType.duration_minutes,
      description: eventType.description || '',
      color: eventType.color || '#0069FF'
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event type? This will also delete all associated availability and meetings.')) {
      return
    }
    try {
      await eventTypesAPI.deleteEventType(id)
      await loadEventTypes()
    } catch (error) {
      alert('Failed to delete event type: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      duration_minutes: 30,
      description: '',
      color: '#0069FF'
    })
    setEditingEvent(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="loading">Loading event types...</div>
  }

  return (
    <div className="event-types-manager">
      <div className="section-header">
        <h2>Event Types</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Create Event Type
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h3>{editingEvent ? 'Edit Event Type' : 'Create Event Type'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Slug *</label>
              <input
                type="text"
                name="slug"
                className="input"
                value={formData.slug}
                onChange={handleInputChange}
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
              />
              <small>Used in booking URL: /book/{formData.slug || 'your-slug'}</small>
            </div>

            <div className="form-group">
              <label>Duration (minutes) *</label>
              <input
                type="number"
                name="duration_minutes"
                className="input"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="5"
                step="5"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                className="input"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingEvent ? 'Update' : 'Create'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="event-types-list">
        {eventTypes.length === 0 ? (
          <div className="empty-state">
            <p>No event types yet. Create your first event type to get started.</p>
          </div>
        ) : (
          eventTypes.map(eventType => (
            <div key={eventType.id} className="card event-type-card">
              <div className="event-type-header">
                <div className="event-type-info">
                  <div
                    className="event-type-color"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <div>
                    <h3>{eventType.name}</h3>
                    <p className="event-type-meta">
                      {eventType.duration_minutes} min • /book/{eventType.slug}
                    </p>
                    {eventType.description && (
                      <p className="event-type-description">{eventType.description}</p>
                    )}
                  </div>
                </div>
                <div className="event-type-actions">
                  <a
                    href={`/book/${eventType.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    View Booking Page
                  </a>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(eventType)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(eventType.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EventTypesManager
