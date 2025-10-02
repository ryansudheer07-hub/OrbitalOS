import React, { useState } from 'react'
import { useTheme } from '../components/ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'

function EnhancedNavigation() {
  const { darkMode } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  const navigationItems = [
    { id: 'home', label: 'Home', href: '#home' },
    { id: 'missions', label: 'Missions', href: '#missions' },
    { id: 'tracking', label: 'Tracking', href: '#tracking' },
    { id: 'analytics', label: 'Analytics', href: '#analytics' },
    { id: 'booking', label: 'Booking', href: '#booking' },
    { id: 'about', label: 'About', href: '#about' }
  ]

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId)
    setIsMenuOpen(false)
    // Smooth scroll to section
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center space-x-8 px-8 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11h14V7l-7-5z"/>
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OrbitalOS
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Theme Toggle & CTA */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
              Mission Control
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-6 py-4">
          {/* Mobile Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11h14V7l-7-5z"/>
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OrbitalOS
            </span>
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="p-6 space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 mt-4">
                Launch Mission Control
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Floating Action Button (Mobile) */}
      <button className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Breadcrumb Navigation */}
      <div className="hidden lg:block fixed top-20 left-6 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Current:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400 capitalize">
              {activeSection}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="hidden lg:block fixed top-20 right-6 z-40">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Navigation</div>
          <div className="space-y-2">
            {navigationItems.map((item, index) => (
              <div
                key={item.id}
                className={`w-8 h-1 rounded-full transition-all duration-300 ${
                  activeSection === item.id
                    ? 'bg-blue-500'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default EnhancedNavigation