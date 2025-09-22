import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Satellite, Shield, Zap, ArrowRight, Globe, Users, BarChart3 } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const [currentSection, setCurrentSection] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  const sections = [
    {
      id: 'hero',
      title: 'Predict. Prevent. Protect.',
      subtitle: 'Secure satellite operations with AI-driven collision prediction',
      description: 'OrbitalOS provides real-time risk assessment, automated conflict resolution, and intelligent maneuver recommendations for satellite operators worldwide.',
      icon: Shield,
      color: 'from-blue-600 to-purple-600',
    },
    {
      id: 'visualization',
      title: '3D Space Visualization',
      subtitle: 'See the cosmos like never before',
      description: 'Interactive 3D Earth with live satellite tracking, orbit traces, and risk-based color coding. Monitor thousands of objects in real-time.',
      icon: Globe,
      color: 'from-green-600 to-teal-600',
    },
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      subtitle: 'Data-driven insights for better decisions',
      description: 'Comprehensive dashboards with risk trends, collision statistics, and operator performance metrics.',
      icon: BarChart3,
      color: 'from-purple-600 to-pink-600',
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return
      
      setIsScrolling(true)
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const sectionIndex = Math.floor(scrollY / windowHeight)
      
      setCurrentSection(Math.min(sectionIndex, sections.length - 1))
      
      setTimeout(() => setIsScrolling(false), 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isScrolling, sections.length])

  const scrollToSection = (index) => {
    window.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Satellite className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">OrbitalOS</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => scrollToSection(0)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection(1)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection(2)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Analytics
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OrbitalOS
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-8 text-gray-300">
              Predict. Prevent. Protect.
            </p>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Secure satellite operations platform with AI-driven collision prediction and intelligent booking system
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollToSection(1)}
                className="btn btn-secondary text-lg px-8 py-4"
              >
                Learn More
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2" />
          </motion.div>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.slice(1).map((section, index) => (
        <section key={section.id} className="h-screen flex items-center justify-center relative">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                <section.icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">{section.title}</h2>
              <h3 className="text-xl md:text-2xl text-gray-300">{section.subtitle}</h3>
              <p className="text-lg text-gray-400">{section.description}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className={`w-full h-96 rounded-2xl bg-gradient-to-br ${section.color} p-8 flex items-center justify-center`}>
                <div className="text-center text-white">
                  <section.icon className="h-24 w-24 mx-auto mb-4 opacity-80" />
                  <p className="text-lg opacity-90">Interactive Demo Coming Soon</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="text-center max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Secure Your Satellites?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join leading satellite operators who trust OrbitalOS for collision prediction and operational safety.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary text-lg px-8 py-4"
              >
                Start Free Trial
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-secondary text-lg px-8 py-4"
              >
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
