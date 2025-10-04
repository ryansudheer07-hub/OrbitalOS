import React, { useMemo } from 'react'

const CosmicStars = ({ count = 50 }) => {
  const stars = useMemo(() => (
    Array.from({ length: count }, (_, i) => ({
      id: `cosmic-star-${i}`,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: 0.3 + Math.random() * 0.7,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 2
    }))
  ), [count])

  return (
    <div className="cosmic-stars-overlay fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <div
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
  )
}

export default CosmicStars