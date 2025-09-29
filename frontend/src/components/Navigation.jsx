import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  // Navigation menu items
  const navigationItems = [
    { label: 'Dashboard', action: () => navigate('/dashboard'), icon: '📊', path: '/dashboard' },
    { label: 'Satellite Tracking', action: () => navigate('/visualizer'), icon: '🛰️', path: '/visualizer' },
    { label: 'Book Orbit', action: () => navigate('/booking'), icon: '🚀', path: '/booking' },
    { label: 'Alerts', action: () => navigate('/alerts'), icon: '⚠️', path: '/alerts' },
    { label: 'AI Co-Pilot', action: () => navigate('/ai-copilot'), icon: '🤖', path: '/ai-copilot' },
    { label: 'Home', action: () => navigate('/'), icon: '🏠', path: '/' },
  ]

  return (
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
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group ${
                  isMenuExpanded ? 'px-4 py-3 space-x-3' : 'p-3 justify-center'
                } ${isActive ? 'bg-white/20 text-white' : ''}`}
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
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Navigation