'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()

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

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-50">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/app" className="text-lg font-semibold tracking-tight">
            Decylo
          </Link>
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href === '/app' && pathname.startsWith('/app/decision'))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                    isActive
                      ? 'bg-[var(--surface-elevated)] text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-elevated)]'
                  }`}
                  title={link.mode ? `${link.mode} mode` : undefined}
                >
                  <span className="relative">
                    {link.label}
                    {link.mode && (
                      <span className="ml-1.5 text-[10px] font-medium text-[var(--text-muted)] opacity-50">
                        ({link.mode})
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}
            <div className="ml-4 pl-4 border-l border-[var(--border)]">
              <button
                onClick={handleSignOut}
                className="h-9 px-4 text-sm font-semibold rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5 active:scale-[0.98] transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

