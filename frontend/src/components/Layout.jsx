import React from 'react'
import Navigation from './Navigation'
import GlobalHeader from './GlobalHeader'

function Layout({ children }) {
  return (
    <div className="cosmic-background relative min-h-screen text-white">
      <div className="cosmic-overlay" />
      <div className="cosmic-content relative z-10">
        <GlobalHeader />
        <main className="pt-28">
          {children}
        </main>
        <Navigation />
      </div>
    </div>
  )
}

export default Layout