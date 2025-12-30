'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isMobileMenuOpen && window.innerWidth < 1024) {
          setIsMobileMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/signin')
    router.refresh()
  }

  const navLinks = [
    { href: '/app', label: 'Today', mode: 'Act' },
    { href: '/app/timeline', label: 'Timeline', mode: 'Act' },
    { href: '/app/insights', label: 'Insights', mode: 'Learn' },
    { href: '/app/new', label: 'New Decision', mode: 'Think' },
    { href: '/app/settings', label: 'Settings', mode: null },
  ]

  const getModeColor = (mode: string | null) => {
    switch (mode) {
      case 'Act':
        return 'text-[var(--success)]'
      case 'Learn':
        return 'text-[var(--primary)]'
      case 'Think':
        return 'text-[var(--warning)]'
      default:
        return 'text-[var(--text-muted)]'
    }
  }

  return (
    <>
      <nav 
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--bg)]/80 backdrop-blur-md border-[var(--border)] shadow-sm'
            : 'bg-[var(--bg)]/95 backdrop-blur-sm border-[var(--border)]'
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/app" 
              className="text-lg font-semibold tracking-tight hover:opacity-90 transition-all duration-200 active:scale-95"
            >
              <span className="bg-gradient-to-r from-[var(--text)] to-[var(--text-muted)] bg-clip-text text-transparent">
                Decylo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href || (link.href === '/app' && pathname.startsWith('/app/decision'))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--text)] bg-[var(--surface-elevated)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
                    }`}
                    title={link.mode ? `${link.mode} mode` : undefined}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <span className="relative flex items-center gap-2">
                      {link.label}
                      {link.mode && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getModeColor(link.mode)} opacity-70`}>
                          {link.mode}
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                    )}
                  </Link>
                )
              })}
              <div className="ml-4 pl-4 border-l border-[var(--border)]">
                <button
                  onClick={handleSignOut}
                  className="h-9 px-4 text-sm font-semibold rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile: Hamburger Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative p-2.5 rounded-xl hover:bg-[var(--surface-elevated)] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ease-out ${
                      isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu Drawer */}
      <div
        ref={menuRef}
        className={`fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] z-50 lg:hidden bg-[var(--bg)] border-l border-[var(--border)] transform transition-transform duration-300 ease-out overflow-y-auto shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex flex-col h-full">
          {/* Mobile Navigation Links */}
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href || (link.href === '/app' && pathname.startsWith('/app/decision'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`relative px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[var(--text)] bg-[var(--surface-elevated)] shadow-sm'
                      : 'text-[var(--text-muted)] active:bg-[var(--surface-elevated)] active:scale-[0.98]'
                  }`}
                  style={{
                    animation: isMobileMenuOpen ? `fadeInUp 0.3s ease-out ${index * 50}ms both` : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{link.label}</span>
                    {link.mode && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getModeColor(link.mode)} opacity-70`}>
                        {link.mode}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--accent)]" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Mobile Sign Out Button */}
          <div className="mt-auto p-4 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleSignOut()
              }}
              className="w-full px-4 py-3.5 text-center text-base font-semibold rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}
