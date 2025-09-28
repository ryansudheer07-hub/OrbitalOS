import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const Globe = ({ satellites = [], selectedSatellite = null, onSatelliteClick }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    const drawEarth = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw Earth base
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation.y * 0.01)

      // Earth gradient
      const earthGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius)
      earthGradient.addColorStop(0, '#4a90e2')
      earthGradient.addColorStop(0.7, '#2c5282')
      earthGradient.addColorStop(1, '#1a202c')

      ctx.fillStyle = earthGradient
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()

      // Continental outlines (simplified)
      ctx.strokeStyle = '#22543d'
      ctx.lineWidth = 2
      ctx.beginPath()
      // North America outline
      ctx.moveTo(-radius * 0.3, -radius * 0.2)
      ctx.quadraticCurveTo(-radius * 0.1, -radius * 0.4, radius * 0.1, -radius * 0.3)
      ctx.quadraticCurveTo(radius * 0.2, -radius * 0.1, radius * 0.1, radius * 0.1)
      ctx.stroke()

      // Europe/Africa outline
      ctx.beginPath()
      ctx.moveTo(radius * 0.2, -radius * 0.3)
      ctx.quadraticCurveTo(radius * 0.4, -radius * 0.1, radius * 0.3, radius * 0.2)
      ctx.quadraticCurveTo(radius * 0.2, radius * 0.4, radius * 0.1, radius * 0.3)
      ctx.stroke()

      ctx.restore()

      // Draw satellites
      satellites.forEach((satellite, index) => {
        const angle = (satellite.longitude || index * 60) * Math.PI / 180
        const lat = (satellite.latitude || (index - satellites.length / 2) * 20) * Math.PI / 180
        
        const orbitRadius = radius + (satellite.altitude || 50)
        const x = centerX + Math.cos(angle) * Math.cos(lat) * orbitRadius
        const y = centerY + Math.sin(lat) * orbitRadius

        // Satellite dot
        ctx.fillStyle = selectedSatellite === satellite.id ? '#ffd700' : '#ff6b6b'
        ctx.beginPath()
        ctx.arc(x, y, selectedSatellite === satellite.id ? 6 : 4, 0, Math.PI * 2)
        ctx.fill()

        // Satellite orbit trace
        ctx.strokeStyle = selectedSatellite === satellite.id ? '#ffd70050' : '#ff6b6b30'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
        ctx.stroke()

        // Satellite label
        if (selectedSatellite === satellite.id) {
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px Inter'
          ctx.fillText(satellite.name || `SAT-${satellite.id}`, x + 10, y - 10)
        }
      })
    }

    const animate = () => {
      if (!isDragging) {
        setRotation(prev => ({ ...prev, y: prev.y + 0.5 }))
      }
      drawEarth()
      animationRef.current = requestAnimationFrame(animate)
    }

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawEarth()
    }

    resizeCanvas()
    animate()

    window.addEventListener('resize', resizeCanvas)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [satellites, selectedSatellite, rotation, isDragging])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setLastMouse({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - lastMouse.x
    const deltaY = e.clientY - lastMouse.y
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }))
    
    setLastMouse({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasClick = (e) => {
    if (isDragging) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is near any satellite
    satellites.forEach(satellite => {
      // Simplified distance check - in a real app you'd do proper 3D projection
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      
      if (distance < 100) { // Rough proximity check
        onSatelliteClick?.(satellite)
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />
      
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 text-white text-sm opacity-75">
        <div>🖱️ Drag to rotate</div>
        <div>🖱️ Click satellites</div>
      </div>
      
      {/* Satellite count */}
      <div className="absolute bottom-4 left-4 text-white">
        <div className="bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          <div className="text-sm opacity-75">Satellites Tracked</div>
          <div className="text-2xl font-bold">{satellites.length}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default Globe