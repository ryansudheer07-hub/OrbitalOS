import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import SatelliteVisualization from '../components/SatelliteVisualization'

function LandingPage() {
  const navigate = useNavigate()
  const [isEntering, setIsEntering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  
  // Refs for smooth scrolling to sections
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const solarSystemRef = useRef(null)
  
  // Navigation scroll functions
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleEnterOrbit = () => {
    setIsEntering(true)
    setTimeout(() => {
      navigate('/login')
    }, 800)
  }

  // Navigation menu items
  const navigationItems = [
    { label: 'Home', action: () => scrollToSection(heroRef), icon: '🏠' },
    { label: 'Features', action: () => scrollToSection(featuresRef), icon: '✨' },
    { label: 'Book Orbit', action: () => navigate('/booking'), icon: '🛰️' },
    { label: 'Launches', action: () => navigate('/launches'), icon: '🚀' },
    { label: 'Compliance', action: () => navigate('/compliance'), icon: '📋' },
    { label: 'AI Co-Pilot', action: () => navigate('/ai-copilot'), icon: '🤖' },
    { label: 'Contact', action: () => navigate('/contact'), icon: '📧' },
  ]

  return (
    <>
      {/* Collapsible Right Side Navigation Panel */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
        <div className={`bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 ${
          isMenuExpanded ? 'p-4' : 'p-2'
        }`}>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            className="w-full flex items-center justify-center p-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 mb-2"
          >
            <span className={`text-xl transition-transform duration-300 ${isMenuExpanded ? 'rotate-180' : ''}`}>
              ☰
            </span>
            {isMenuExpanded && (
              <span className="ml-3 text-sm font-medium animate-fade-in">
                Menu
              </span>
            )}
          </button>

          {/* Navigation Items */}
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group ${
                  isMenuExpanded ? 'px-4 py-3 space-x-3' : 'p-3 justify-center'
                }`}
                title={!isMenuExpanded ? item.label : ''}
              >
                <span className={`text-lg group-hover:scale-110 transition-transform duration-300 ${
                  !isMenuExpanded ? 'text-xl' : ''
                }`}>
                  {item.icon}
                </span>
                
                {isMenuExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap animate-fade-in">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Reserve Orbit CTA */}
      <button
        onClick={() => navigate('/booking')}
        className="fixed right-6 bottom-8 z-50 group"
      >
        <div className="relative">
          {/* Glowing border animation */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-2xl blur opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-300"></div>
          
          {/* Main button */}
          <div className="relative bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-4 rounded-2xl font-bold text-white shadow-2xl transform group-hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span>Reserve Orbit</span>
            </div>
            
            {/* Inner glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          {/* Orbiting particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{
              top: '10%',
              right: '10%',
              animationDelay: '0s'
            }}></div>
            <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{
              bottom: '15%',
              left: '15%',
              animationDelay: '0.5s'
            }}></div>
            <div className="absolute w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{
              top: '50%',
              left: '5%',
              animationDelay: '1s'
            }}></div>
          </div>
        </div>
      </button>

      {/* Hero Section */}
      <div ref={heroRef} className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center">
        {/* Clean space background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black"></div>
        
        {/* Subtle starfield */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            OrbixX
          </div>
          
          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Home</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Features</a>
            <a href="#" className="text-white hover:text-gray-300 transition-colors">Book Orbit</a>
          </nav>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Every void needs an order.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            We make the crowded sky navigable — secure your orbit, book your launch, chart your path.
          </p>
          
          <button
            onClick={handleEnterOrbit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Enter Orbit
          </button>
        </div>
      </div>

      {/* Satellite Tracking Section */}
      <div ref={solarSystemRef} className="relative">
        {/* Features placeholder section for navigation */}
        <div ref={featuresRef} className="h-1 absolute -top-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-purple-900 to-transparent opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center py-16 px-4">
          <h2 
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6"
            style={{
              textShadow: '0 0 30px rgba(147, 197, 253, 0.5)',
            }}
          >
            Live Satellite Tracking
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Real-time visualization of satellites, space debris, and orbital paths around Earth
          </p>
        </div>
        
        <SatelliteVisualization />
      </div>
    </>
  )
}

export default LandingPage