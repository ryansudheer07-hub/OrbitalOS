import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Simple CSS-based Starfield Component (more reliable than canvas)
const Starfield = () => {
  const [stars, setStars] = useState([])

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const starArray = []
      const starCount = window.innerWidth < 768 ? 100 : 200
      
      for (let i = 0; i < starCount; i++) {
        starArray.push({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          animationDelay: Math.random() * 3,
          animationDuration: 2 + Math.random() * 3,
          size: Math.random() * 3 + 1,
          opacity: 0.3 + Math.random() * 0.7,
        })
      }
      setStars(starArray)
    }

    generateStars()
    
    // Regenerate stars on window resize
    const handleResize = () => {
      generateStars()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-gray-900 via-blue-900 to-black">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.animationDelay}s`,
            animationDuration: `${star.animationDuration}s`,
          }}
        />
      ))}
      
      {/* Additional floating elements for depth */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-pink-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
    </div>
  )
}

const LandingPage = () => {
  const navigate = useNavigate()
  const [isEntering, setIsEntering] = useState(false)

  const handleEnterOrbit = () => {
    setIsEntering(true)
    // Add whoosh animation delay before navigation
    setTimeout(() => {
      navigate('/login')
    }, 800)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Starfield Background */}
      <Starfield />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 z-10" />
      
      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Slogan */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-8 tracking-wide max-w-6xl"
        >
          Every void needs an order.
        </motion.h1>
        
        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 mb-12 max-w-5xl leading-relaxed"
        >
          We make the crowded sky navigable — secure your orbit, book your launch, chart your path.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center"
        >
          <button
            onClick={handleEnterOrbit}
            disabled={isEntering}
            className={`
              relative px-8 sm:px-12 py-4 sm:py-6 text-xl sm:text-2xl font-bold text-white
              bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600
              rounded-full shadow-2xl transform transition-all duration-300
              hover:scale-105 hover:shadow-3xl
              ${isEntering ? 'scale-110 animate-pulse' : ''}
            `}
            style={{
              boxShadow: isEntering 
                ? '0 0 50px rgba(59, 130, 246, 0.8)' 
                : '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)'
            }}
          >
            {isEntering ? 'Entering Orbit...' : 'Enter Orbit'}
          </button>

          <button
            onClick={() => navigate('/solar')}
            className="
              px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-semibold text-white
              bg-gradient-to-r from-purple-600 to-pink-600 border-2 border-purple-400
              rounded-full shadow-xl transform transition-all duration-300
              hover:scale-105 hover:shadow-2xl hover:border-purple-300
            "
          >
            🌍 Explore Solar System
          </button>
        </motion.div>
        
        {/* Hint Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="text-gray-400 text-sm sm:text-base mt-8 opacity-70"
        >
          Click to begin your orbital journey
        </motion.p>
      </div>
    </div>
  )
}

export default LandingPage
