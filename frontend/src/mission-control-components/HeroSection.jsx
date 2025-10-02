import React, { useState, useEffect } from 'react'
import { useTheme } from '../components/ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'

function HeroSection() {
  const { darkMode } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const slides = [
    {
      title: "Explore the Universe",
      subtitle: "Advanced Space Mission Control",
      description: "Monitor, track, and manage space missions with cutting-edge technology and real-time data visualization.",
      cta: "Launch Mission Control",
      background: "from-blue-600 via-purple-600 to-indigo-800"
    },
    {
      title: "Real-Time Tracking",
      subtitle: "Satellite Monitoring Excellence",
      description: "Track thousands of satellites with precision accuracy and comprehensive orbital analytics.",
      cta: "Start Tracking",
      background: "from-purple-600 via-pink-600 to-red-700"
    },
    {
      title: "Mission Planning",
      subtitle: "Strategic Space Operations",
      description: "Plan and execute complex space missions with our advanced mission planning and optimization tools.",
      cta: "Plan Mission",
      background: "from-green-600 via-teal-600 to-blue-700"
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setIsAnimating(false)
      }, 300)
    }, 5000)

    return () => clearInterval(timer)
  }, [slides.length])

  const handleSlideChange = (index) => {
    if (index !== currentSlide) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentSlide(index)
        setIsAnimating(false)
      }, 300)
    }
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.background} transition-all duration-1000`}>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11h14V7l-7-5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">
                OrbitalOS
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-white/80 hover:text-white font-medium transition-colors duration-200">
                Home
              </button>
              <button className="text-white/80 hover:text-white font-medium transition-colors duration-200">
                Missions
              </button>
              <button className="text-white/80 hover:text-white font-medium transition-colors duration-200">
                Tracking
              </button>
              <button className="text-white/80 hover:text-white font-medium transition-colors duration-200">
                About
              </button>
              <div className="bg-white/20 rounded-lg p-2">
                <ThemeToggle />
              </div>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                Mission Control
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-2">
                <ThemeToggle />
              </div>
              <button className="text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
          {/* Main headline */}
          <div className="space-y-6 mb-12">
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-tight">
              <span className="block">{currentSlideData.title}</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                {currentSlideData.subtitle}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {currentSlideData.description}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button className="group relative px-10 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-bold text-lg transform hover:scale-105 transition-all duration-300 shadow-2xl border border-white/30">
              <span className="relative z-10">{currentSlideData.cta}</span>
              <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="px-10 py-4 border-2 border-white/50 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
              Learn More
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-3 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">5,000+</div>
              <div className="text-white/80">Satellites Tracked</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-white/80">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-white/80">Mission Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-white/60 text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection