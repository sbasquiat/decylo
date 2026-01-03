import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProofSection from '@/components/ProofSection'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If authenticated, redirect to app (middleware should handle this, but double-check)
  if (user) {
    redirect('/app')
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Decylo
            </Link>
            <div className="flex gap-3">
              <Link 
                href="/signin"
                className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition"
              >
                Sign In
              </Link>
              <Link 
                href="/signup"
                className="px-4 py-2 text-sm font-medium bg-[#4C7DFF] text-[#071024] rounded-lg hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text)]">
              Make better decisions.<br />
              Every day.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
              Decylo is a judgment training system. Capture decisions, evaluate options, commit with confidence, and learn from every outcome.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/signup"
                className="px-6 py-3 bg-[#4C7DFF] text-[#071024] font-semibold rounded-lg hover:opacity-90 transition w-full sm:w-auto text-center"
              >
                Get Started
              </Link>
              <Link 
                href="/signin"
                className="px-6 py-3 border border-[var(--border)] text-[var(--text)] font-semibold rounded-lg hover:bg-[var(--surface-elevated)] transition w-full sm:w-auto text-center"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">Capture</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Record real decisions you're facing. Be specific about the options and context.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">Evaluate</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Score each option across multiple dimensions. See which path maximizes value.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">Reflect</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Log outcomes and learn. Your judgment improves with every loop you close.
              </p>
            </div>
          </div>
        </div>

        {/* Proof Section */}
        <ProofSection />
      </main>
      <footer className="border-t border-[var(--border)] bg-[var(--bg)] mt-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              © {new Date().getFullYear()} Decylo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

