import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

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
      <Navbar />
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
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2">Capture</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Record real decisions you're facing. Be specific about the options and context.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2">Evaluate</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Score each option across multiple dimensions. See which path maximizes value.
              </p>
            </div>
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              <h3 className="text-lg font-semibold mb-2">Reflect</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Log outcomes and learn. Your judgment improves with every loop you close.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

