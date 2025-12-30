'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Check if we're on an auth page - don't register service worker there
      // to prevent redirect issues
      const pathname = window.location.pathname
      if (pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')) {
        // Unregister service worker on auth pages to prevent redirect conflicts
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister()
          })
        })
        return
      }

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          // Check for updates
          registration.update()
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}


