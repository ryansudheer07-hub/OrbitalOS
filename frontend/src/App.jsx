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
import Layout from './components/Layout'

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes with Layout (includes Navigation) */}
      <Route 
        path="/dashboard" 
        element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/visualizer" 
        element={user ? <Layout><Visualizer /></Layout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/booking" 
        element={user ? <Layout><BookingPage /></Layout> : <Navigate to="/login" />} 
      />
      <Route 
        path="/alerts" 
        element={user ? <Layout><AlertsPage /></Layout> : <Navigate to="/login" />} 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
