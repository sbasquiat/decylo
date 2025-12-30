'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/Button'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

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

  const navLinks = [
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/guide', label: 'Guide' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/faq', label: 'FAQ' },
  ]

  return (
    <>
      <nav className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-50 backdrop-blur-sm bg-[var(--bg)]/95">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              href="/" 
              className="text-lg font-semibold tracking-tight hover:opacity-90 transition"
            >
              Decylo
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'text-[var(--text)] bg-[var(--surface-elevated)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="ml-2 flex items-center gap-2">
                <Link
                  href="/signin"
                  className="px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  Sign In
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>

            {/* Mobile: CTA Button (visible when menu closed) */}
            <div className="lg:hidden flex items-center gap-3">
              {!isMobileMenuOpen && (
                <Link href="/signup">
                  <Button className="text-sm px-4 py-2">Get Started</Button>
                </Link>
              )}
              {/* Hamburger Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl hover:bg-[var(--surface-elevated)] transition active:scale-95"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ${
                      isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ${
                      isMobileMenuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`h-0.5 w-6 bg-[var(--text)] transition-all duration-300 ${
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
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] z-50 lg:hidden bg-[var(--bg)] border-l border-[var(--border)] transform transition-transform duration-300 ease-out overflow-y-auto shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Navigation Links */}
          <div className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-base font-medium transition ${
                    isActive
                      ? 'text-[var(--text)] bg-[var(--surface-elevated)]'
                      : 'text-[var(--text-muted)] active:bg-[var(--surface-elevated)]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile Auth Buttons */}
          <div className="mt-auto p-4 space-y-3 border-t border-[var(--border)]">
            <Link
              href="/signin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full px-4 py-3 text-center text-base font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition rounded-xl hover:bg-[var(--surface-elevated)]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full"
            >
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
