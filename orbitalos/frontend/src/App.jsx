import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Visualizer from './pages/Visualizer'
import BookingPage from './pages/BookingPage'
import AlertsPage from './pages/AlertsPage'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/visualizer" 
        element={user ? <Visualizer /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/booking" 
        element={user ? <BookingPage /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/alerts" 
        element={user ? <AlertsPage /> : <Navigate to="/login" />} 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
