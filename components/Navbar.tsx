import Link from 'next/link'
import { Button } from './ui/Button'

export default function Navbar() {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Decylo
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/how-it-works"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              How It Works
            </Link>
            <Link
              href="/guide"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              Guide
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              About
            </Link>
            <Link
              href="/faq"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              FAQ
            </Link>
            <Link
              href="/signin"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              Sign In
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
          {/* Mobile menu button - can be enhanced later */}
          <div className="md:hidden">
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

