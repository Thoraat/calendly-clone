import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminDashboard from './components/AdminDashboard'
import BookingPage from './components/BookingPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/book/:slug" element={<BookingPage />} />
      </Routes>
    </Router>
  )
}

export default App
