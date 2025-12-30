'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/Button'

export default function AuthNavbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Decylo
          </Link>
          <div>
            {pathname === '/signin' ? (
              <Link href="/signup">
                <Button variant="secondary">Create account</Button>
              </Link>
            ) : pathname === '/signup' ? (
              <Link href="/signin">
                <Button variant="secondary">Sign in</Button>
              </Link>
            ) : pathname === '/forgot-password' ? (
              <Link href="/signin">
                <Button variant="secondary">Back to sign in</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  )
}


