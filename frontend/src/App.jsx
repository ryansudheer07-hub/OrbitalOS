import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import LoadingSpinner from './components/LoadingSpinner'
import Layout from './components/Layout'
import CosmicStars from './components/CosmicStars'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Visualizer = lazy(() => import('./pages/SimpleVisualizer'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="cosmic-background">
      <CosmicStars count={100} />
      <div className="cosmic-nebula" />
      <div className="cosmic-aurora" />
      <Suspense fallback={<LoadingSpinner />}>
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
    </Suspense>
    </div>
  )
}

export default App
