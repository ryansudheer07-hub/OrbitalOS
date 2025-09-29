import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()
  const [isEntering, setIsEntering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  
  // Refs for smooth scrolling to sections
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const solarSystemRef = useRef(null)
  const visionRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      })
    }

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleEnterOrbit = () => {
    setIsEntering(true)
    setTimeout(() => {
      navigate('/login')
    }, 800)
  }

  return (
    <>
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
              className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            OrbixX
            <p className="text-sm text-gray-300 font-normal mt-1">
              "Making space accessible, predictable, and safe for generations to come."
            </p>
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Every void needs an order.
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            We make the crowded sky navigable — secure your orbit, book your launch, chart your path.
          </p>
          
          <button
            onClick={handleEnterOrbit}
            className="relative group overflow-hidden"
          >
            {/* Glowing outer ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full blur-sm opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-300"></div>
            
            {/* Main button */}
            <div className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-600 px-12 py-4 rounded-full text-lg font-bold text-white shadow-2xl transform group-hover:scale-105 transition-all duration-300 border border-white/20">
              <div className="flex items-center space-x-3">
                <span className="text-xl">🚀</span>
                <span className="tracking-wider">Enter Orbit</span>
                <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
              </div>
              
              {/* Inner shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
              
              {/* Orbiting particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                <div className="absolute w-2 h-2 bg-cyan-300 rounded-full animate-ping opacity-75" style={{
                  top: '20%',
                  right: '15%',
                  animationDelay: '0s',
                  animationDuration: '2s'
                }}></div>
                <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping opacity-75" style={{
                  bottom: '25%',
                  left: '20%',
                  animationDelay: '0.7s',
                  animationDuration: '2.5s'
                }}></div>
                <div className="absolute w-1 h-1 bg-blue-300 rounded-full animate-ping opacity-75" style={{
                  top: '60%',
                  left: '10%',
                  animationDelay: '1.4s',
                  animationDuration: '1.8s'
                }}></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* OUR VISION Parallax Section */}
      <div ref={visionRef} className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-gray-900 to-slate-800 pb-20">
        {/* Parallax Background Elements */}
        <div className="absolute inset-0">
          {/* Moving stars with parallax effect */}
          <div 
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          >
            {Array.from({ length: 150 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>

          {/* Floating geometric shapes with parallax */}
          <div 
            className="absolute inset-0"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          >
            <div className="absolute top-20 left-10 w-20 h-20 border border-cyan-400/30 rotate-45 animate-pulse"></div>
            <div className="absolute top-40 right-16 w-16 h-16 border border-purple-400/20 rotate-12 animate-bounce"></div>
            <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-blue-500/10 rounded-full animate-ping"></div>
            <div className="absolute top-1/3 right-1/3 w-8 h-8 border-2 border-cyan-300/40 animate-spin"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Section Title with parallax effect */}
            <div 
              className="text-center mb-16"
              style={{
                transform: `translateY(${scrollY * 0.1}px)`
              }}
            >
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                OUR VISION
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-600 mx-auto mb-8"></div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Revolutionary Mission */}
              <div 
                className="space-y-8"
                style={{
                  transform: `translateY(${scrollY * 0.15}px)`
                }}
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
                    🚀 Revolutionary Mission
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Born in 2025, OrbixX emerged from a simple yet profound realization: space is becoming as congested as Earth's highways. We're pioneering the world's first comprehensive orbital traffic management system, transforming chaos into order.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center">
                    🌌 Why Revolutionary?
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    We're not just booking satellites - we're architecting the future of space commerce. Our AI-powered orbital prediction engine and real-time collision avoidance system will save billions in space assets while enabling unprecedented space accessibility.
                  </p>
                </div>
              </div>

              {/* Right Side - Team & Vision */}
              <div 
                className="space-y-8"
                style={{
                  transform: `translateY(${scrollY * 0.2}px)`
                }}
              >
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-bold text-blue-400 mb-6 flex items-center">
                    👥 Our Foundation
                  </h3>
                  <p className="text-white text-lg leading-relaxed">
                    Started in 2025 by a team of CS:AI & ML students in Christ University.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                  <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center">
                    🎯 Our Impact
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-cyan-400">10,000+</p>
                      <p className="text-gray-400 text-sm">Tracked Objects</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-400">99.9%</p>
                      <p className="text-gray-400 text-sm">Accuracy Rate</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-400">24/7</p>
                      <p className="text-gray-400 text-sm">Monitoring</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-400">Zero</p>
                      <p className="text-gray-400 text-sm">Collisions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features placeholder section for navigation */}
      <div ref={featuresRef} className="h-1 absolute -top-20"></div>
    </>
  )
}

export default LandingPage