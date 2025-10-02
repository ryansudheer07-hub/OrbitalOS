import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useCycle } from 'framer-motion'
import GlobalHeader from '../components/GlobalHeader'
const featureVideoUrl = new URL('../../../visuals/44350-438661984.mp4', import.meta.url).href
const earthCtaImageUrl = new URL('../../../visuals/Coming Soon Website Coming Soon Page in Black White Dark Futuristic Style.png', import.meta.url).href

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
      <div className="relative min-h-screen overflow-hidden bg-black text-white flex items-center justify-center px-6 pt-32 pb-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black" />
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(${scrollY * -0.02}px, ${scrollY * -0.08}px, 0)`
              }}
            >
              {stars.map((star) => (
                <span
                  key={star.id}
                  className="absolute rounded-full bg-white"
                  style={{
                    left: `${star.left}%`,
                    top: `${star.top}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    opacity: star.opacity,
                    animation: `star-float ${star.duration}s ease-in-out ${star.delay}s infinite alternate`
                  }}
                />
              ))}
            </div>
          </div>
          <motion.div
            className="pointer-events-none absolute -top-40 -left-32 h-[540px] w-[540px] bg-gradient-to-tr from-sky-400/70 via-blue-500/40 to-purple-500/60 blur-3xl"
            animate={{
              borderRadius: activeMorph.borderRadius,
              rotate: activeMorph.rotate,
              opacity: [0.28, 0.42, 0.32],
            }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute bottom-0 right-0 h-[480px] w-[480px] bg-gradient-to-br from-amber-400/70 via-rose-500/40 to-indigo-500/60 blur-3xl"
            animate={{
              borderRadius: activeMorph.borderRadius,
              rotate: activeMorph.rotate.map((value) => value * -1),
              opacity: [0.32, 0.5, 0.38],
            }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: 1.2 }}
          />
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-6">
          <div className="space-y-6">
            <div className="text-4xl md:text-6xl font-extrabold tracking-[0.35em] uppercase text-white">
              OrbitalOS
            </div>
            <motion.p
              className="max-w-2xl text-base md:text-lg text-white/70 mx-auto"
              animate={{ opacity: [0.6, 1, 0.8], y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              Making space accessible, predictable, and safe for generations to come.
            </motion.p>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden bg-black text-white min-h-screen flex items-center py-24">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          src={featureVideoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[0.35em] uppercase text-white">
              Mission Suite
            </h2>
            <p className="text-sm md:text-base text-white/70">
              Tools engineered to keep your fleet in motion.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURE_TAGS.map((tag) => (
              <div
                key={tag.label}
                className="flex h-28 flex-col items-start justify-between rounded-xl border border-white/10 bg-black/60 px-6 py-5"
              >
                <span className="text-2xl">{tag.icon}</span>
                <p className="text-sm font-medium text-white/80 leading-snug">
                  {tag.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-black px-6 py-24 text-white">
        <div className="absolute inset-0">
          <img
            src={earthCtaImageUrl}
            alt="Earth horizon"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black" />
        </div>

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