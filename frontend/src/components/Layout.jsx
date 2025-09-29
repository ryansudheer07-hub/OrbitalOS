import React from 'react'
import Navigation from './Navigation'

function Layout({ children }) {
  return (
    <div className="relative">
      {children}
      <Navigation />
    </div>
  )
}

export default Layout