import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useCycle } from 'framer-motion'
import GlobalHeader from '../components/GlobalHeader'

// Image URLs for hero gallery
const cosmicBackgroundUrl = '/cosmic-background.jpg'
const featureVideoUrl = new URL('../../../visuals/44350-438661984.mp4', import.meta.url).href
const earthCtaImageUrl = new URL('../../../visuals/Coming Soon Website Coming Soon Page in Black White Dark Futuristic Style.png', import.meta.url).href
const satelliteIconUrl = '/satellite-icon.png'

const FEATURE_TAGS = [
  { label: 'Real-time collision alerts', icon: '🛰️' },
  { label: 'AI orbital risk scoring', icon: '🤖' },
  { label: 'Launch window marketplace', icon: '📈' },
  { label: 'Encrypted telemetry pipeline', icon: '🛡️' },
]

const STAR_COUNT = 140

const MORPH_KEYFRAMES = [
  {
    borderRadius: ['45% 55% 60% 40% / 40% 50% 50% 60%', '60% 40% 45% 55% / 55% 35% 65% 45%', '55% 45% 50% 50% / 40% 60% 40% 60%'],
    rotate: [0, 45, -30],
  },
  {
    borderRadius: ['65% 35% 55% 45% / 35% 65% 35% 65%', '40% 60% 60% 40% / 60% 40% 60% 40%', '52% 48% 45% 55% / 45% 55% 48% 52%'],
    rotate: [15, -20, 10],
  },
]

function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()
  const [morphIndex, cycleMorphIndex] = useCycle(0, 1)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const stars = useMemo(() => (
    Array.from({ length: STAR_COUNT }, (_, i) => ({
      id: `hero-star-${i}`,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 1.4 + 0.4,
      opacity: 0.35 + Math.random() * 0.45,
      duration: 12 + Math.random() * 8,
      delay: Math.random() * 4
    }))
  ), [])

  useEffect(() => {
    const timer = setInterval(() => {
      cycleMorphIndex()
    }, 6000)

    return () => clearInterval(timer)
  }, [cycleMorphIndex])

  const activeMorph = MORPH_KEYFRAMES[morphIndex]

  return (
    <>
      <GlobalHeader />

      {/* Hero Section */}
<div className="cosmic-background relative min-h-screen overflow-hidden text-white">
        <div className="cosmic-overlay" />
        <div className="cosmic-particles">
          {stars.map((star) => (
            <span
              key={star.id}
              className="cosmic-particle absolute"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite alternate`
              }}
            />
          ))}
        </div>

        {/* Main Hero Content */}
        <div className="cosmic-content relative z-20 min-h-screen flex flex-col justify-center px-6 py-20">
          {/* Title Section */}
          <div className="text-center mb-16 max-w-6xl mx-auto">
            <motion.div 
              className="cosmic-text text-5xl md:text-7xl lg:text-8xl font-black tracking-[0.05em] uppercase mb-6"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              OrbitalOS
            </motion.div>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mb-8"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <motion.p
              className="cosmic-text-secondary max-w-3xl text-lg md:text-xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              Next-generation orbital mechanics platform. Real-time satellite tracking, 
              AI-powered collision detection, and mission-critical space operations.
            </motion.p>
          </div>

          {/* Mission Gallery Grid */}
          <div className="max-w-7xl mx-auto w-full">
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              {/* Featured Video - Large Card */}
              <div className="lg:col-span-2">
                <div className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all duration-500">
                  <div className="relative">
                    <video 
                      src={featureVideoUrl}
                      className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs uppercase tracking-widest text-red-400 font-semibold">LIVE MISSION</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">Orbital Mechanics Demo</h3>
                      <p className="text-white/80 text-base leading-relaxed max-w-2xl">
                        Real-time satellite trajectory visualization with SGP4 propagation models and collision analysis algorithms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Image Cards Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.6 }}
            >
              {/* Cosmic Overview Card */}
              <div className="group relative overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="relative">
                  <img 
                    src={cosmicBackgroundUrl} 
                    alt="Cosmic Space Overview" 
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🌍</span>
                    <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">EARTH OVERVIEW</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Planetary Systems</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Complete view of Earth-Moon system, planetary positions, and ISS orbital tracking
                  </p>
                </div>
              </div>

              {/* Mission Control Card */}
              <div className="group relative overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-purple-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="relative">
                  <img 
                    src={earthCtaImageUrl} 
                    alt="Mission Control Interface" 
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🚀</span>
                    <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">COMMAND CENTER</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Mission Control</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Advanced space operations interface with real-time telemetry and mission planning
                  </p>
                </div>
              </div>

              {/* Satellite Tracking Card */}
              <div className="group relative overflow-hidden rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
                <div className="relative h-56 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                  <img 
                    src={satelliteIconUrl} 
                    alt="Satellite Tracking" 
                    className="w-24 h-24 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700"
                  />
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                  </div>
                  {/* Orbital rings animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border border-cyan-400/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
                    <div className="absolute w-40 h-40 border border-cyan-400/20 rounded-full animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🛰️</span>
                    <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">TRACKING SYSTEM</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Satellite Network</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Precision orbital mechanics with AI-powered collision detection and avoidance
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div 
              className="text-center mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2 }}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/booking')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold uppercase tracking-wider transition-all duration-300 hover:from-blue-500 hover:to-purple-500 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-105"
                >
                  <span className="flex items-center gap-3">
                    Launch Mission
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 border border-white/30 rounded-xl text-white font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-white/10 hover:border-white/50"
                >
                  Mission Control
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="cosmic-background relative overflow-hidden text-white min-h-screen flex items-center py-24">
        <div className="cosmic-overlay" />
        <div className="cosmic-content relative z-10 max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="cosmic-text text-3xl md:text-4xl font-semibold tracking-[0.35em] uppercase">
              Mission Suite
            </h2>
            <p className="cosmic-text-secondary text-sm md:text-base">
              Tools engineered to keep your fleet in motion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURE_TAGS.map((tag) => (
              <div
                key={tag.label}
                className="cosmic-card flex h-28 flex-col items-start justify-between px-6 py-5"
              >
                <span className="text-2xl">{tag.icon}</span>
                <p className="cosmic-text-secondary text-sm font-medium leading-snug">
                  {tag.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cosmic-background relative flex min-h-screen items-center justify-center px-6 py-24 text-white">
        <div className="cosmic-overlay" />

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6">
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">Mission Logistics</p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              Let’s make <span className="text-[#ffe45c]">LEO</span> accessible to all
            </h2>
            <p className="text-base text-white/70">
              Reserve your orbital corridor, analyze conflicts in seconds, and launch with a precision-tuned trajectory backed by real-time SGP4 propagation.
            </p>
          </div>

          <div className="flex w-full max-w-md flex-col gap-6">
            <button
              type="button"
              onClick={() => navigate('/booking')}
              className="group flex items-center justify-between rounded-xl border border-white/20 bg-black/60 px-6 py-4 text-left transition hover:border-white hover:bg-white/10"
            >
              <span className="text-sm uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
                Reserve Orbit
              </span>
              <span className="flex items-center gap-3">
                <span className="text-white/60 transition group-hover:text-white">Launch planner</span>
                <span className="flex h-10 w-16 items-center justify-center rounded-lg bg-white text-black transition group-hover:bg-[#ffe45c]">
                  →
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/booking?mode=rideshare')}
              className="group flex items-center justify-between rounded-xl border border-white/20 bg-black/40 px-6 py-4 text-left transition hover:border-white hover:bg-white/10"
            >
              <span className="text-sm uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
                Book a rideshare
              </span>
              <span className="flex items-center gap-3">
                <span className="text-white/60 transition group-hover:text-white">Payload concierge</span>
                <span className="flex h-10 w-16 items-center justify-center rounded-lg bg-white text-black transition group-hover:bg-[#ffe45c]">
                  →
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

export default LandingPage