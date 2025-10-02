import React from 'react'
import Navigation from './Navigation'
import GlobalHeader from './GlobalHeader'

function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-black text-white">
      <GlobalHeader />
      <main className="pt-28">
        {children}
      </main>
      <Navigation />
    </div>
  )
}

export default Layout