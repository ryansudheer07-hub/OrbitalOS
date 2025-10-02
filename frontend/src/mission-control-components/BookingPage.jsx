import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../components/ThemeProvider'
import ThemeToggle from '../components/ThemeToggle'

function BookingPage() {
  const { darkMode } = useTheme()
  const [selectedMission, setSelectedMission] = useState(null)
  const [formData, setFormData] = useState({
    missionName: '',
    missionType: 'satellite-deployment',
    launchDate: '',
    duration: '',
    budget: '',
    organization: '',
    contactEmail: '',
    requirements: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)

  const missionTypes = [
    {
      id: 'satellite-deployment',
      name: 'Satellite Deployment',
      description: 'Deploy communication, observation, or research satellites',
      duration: '3-12 months',
      cost: '$500K - $5M',
      icon: '🛰️'
    },
    {
      id: 'space-station',
      name: 'Space Station Mission',
      description: 'Crewed missions to space stations for research and maintenance',
      duration: '6-18 months',
      cost: '$10M - $50M',
      icon: '🚀'
    },
    {
      id: 'deep-space',
      name: 'Deep Space Exploration',
      description: 'Interplanetary missions and deep space research',
      duration: '2-10 years',
      cost: '$100M - $1B',
      icon: '🌌'
    },
    {
      id: 'commercial',
      name: 'Commercial Launch',
      description: 'Commercial payload deployment and space tourism',
      duration: '1-6 months',
      cost: '$100K - $2M',
      icon: '🚀'
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMissionSelect = (mission) => {
    setSelectedMission(mission)
    setFormData(prev => ({
      ...prev,
      missionType: mission.id
    }))
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setStep(4) // Success step
  }

  return (
    <div className="bg-white dark:bg-gray-900 transition-colors duration-500 min-h-screen">
      {/* Professional Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2L3 7v11h14V7l-7-5z"/>
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mission Booking
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600 dark:border-blue-400 pb-1">
                Book Mission
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                My Missions
              </button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200">
                Pricing
              </button>
              <ThemeToggle />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              <ThemeToggle />
              <button className="text-gray-700 dark:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Book Your Space Mission
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Plan and reserve your orbital mission with our comprehensive booking platform.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-8">
            {[
              { num: 1, title: 'Select Mission', active: step >= 1, completed: step > 1 },
              { num: 2, title: 'Mission Details', active: step >= 2, completed: step > 2 },
              { num: 3, title: 'Review & Submit', active: step >= 3, completed: step > 3 },
              { num: 4, title: 'Confirmation', active: step >= 4, completed: step > 4 }
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium text-sm transition-all duration-300 ${
                  stepItem.completed 
                    ? 'bg-green-500 text-white' 
                    : stepItem.active 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {stepItem.completed ? '✓' : stepItem.num}
                </div>
                <span className={`ml-2 font-medium ${
                  stepItem.active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {stepItem.title}
                </span>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    stepItem.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Mission Type Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {missionTypes.map((mission) => (
              <div
                key={mission.id}
                onClick={() => handleMissionSelect(mission)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-4xl mb-4">{mission.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {mission.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {mission.description}
                </p>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Duration: {mission.duration}</span>
                  <span>Cost: {mission.cost}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Mission Details Form */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Mission Details for {selectedMission?.name}
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mission Name
                    </label>
                    <input
                      type="text"
                      name="missionName"
                      value={formData.missionName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Enter mission name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="Your organization"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Launch Date
                    </label>
                    <input
                      type="date"
                      name="launchDate"
                      value={formData.launchDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mission Duration
                    </label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">Select duration</option>
                      <option value="1-3-months">1-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6-12-months">6-12 months</option>
                      <option value="1-2-years">1-2 years</option>
                      <option value="2-years-plus">2+ years</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget Range
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    >
                      <option value="">Select budget</option>
                      <option value="100k-500k">$100K - $500K</option>
                      <option value="500k-1m">$500K - $1M</option>
                      <option value="1m-5m">$1M - $5M</option>
                      <option value="5m-10m">$5M - $10M</option>
                      <option value="10m-plus">$10M+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Special Requirements
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                    placeholder="Describe any special requirements for your mission..."
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Continue to Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                Review Your Mission
              </h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mission Type</h3>
                  <p className="text-gray-600 dark:text-gray-300">{selectedMission?.name}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mission Name</h3>
                    <p className="text-gray-600 dark:text-gray-300">{formData.missionName}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Organization</h3>
                    <p className="text-gray-600 dark:text-gray-300">{formData.organization}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Launch Date</h3>
                    <p className="text-gray-600 dark:text-gray-300">{formData.launchDate}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Duration</h3>
                    <p className="text-gray-600 dark:text-gray-300">{formData.duration}</p>
                  </div>
                </div>

                {formData.requirements && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Special Requirements</h3>
                    <p className="text-gray-600 dark:text-gray-300">{formData.requirements}</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Mission Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Mission Request Submitted!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your mission request has been successfully submitted. Our team will review your request and contact you within 24-48 hours.
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reference ID: <span className="font-mono font-semibold">MSN-{Date.now().toString().slice(-6)}</span>
                </p>
              </div>
              <button
                onClick={() => { setStep(1); setSelectedMission(null); setFormData({
                  missionName: '', missionType: 'satellite-deployment', launchDate: '',
                  duration: '', budget: '', organization: '', contactEmail: '', requirements: ''
                }); }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Book Another Mission
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingPage