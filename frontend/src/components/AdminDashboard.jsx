import React, { useState, useEffect } from 'react'
import EventTypesManager from './admin/EventTypesManager'
import AvailabilityManager from './admin/AvailabilityManager'
import MeetingsManager from './admin/MeetingsManager'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('events')

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <nav className="admin-nav">
            <button
              className={activeTab === 'events' ? 'active' : ''}
              onClick={() => setActiveTab('events')}
            >
              Event Types
            </button>
            <button
              className={activeTab === 'availability' ? 'active' : ''}
              onClick={() => setActiveTab('availability')}
            >
              Availability
            </button>
            <button
              className={activeTab === 'meetings' ? 'active' : ''}
              onClick={() => setActiveTab('meetings')}
            >
              Meetings
            </button>
          </nav>
        </div>
      </header>

      <main className="admin-main">
        <div className="container">
          {activeTab === 'events' && <EventTypesManager />}
          {activeTab === 'availability' && <AvailabilityManager />}
          {activeTab === 'meetings' && <MeetingsManager />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
