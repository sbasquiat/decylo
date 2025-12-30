'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import PasswordInput from '@/components/ui/PasswordInput'
import { Card } from '@/components/ui/Card'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/app'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Better error messages
      if (signInError.message.includes('Invalid login credentials') || 
          signInError.message.includes('Email not confirmed')) {
        setError('Incorrect email or password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setLoading(false)
      return
    }

    if (data.session) {
      // CRITICAL: Wait longer for cookies to be properly set and persisted
      // The browser needs time to store cookies before navigation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify session is still valid before redirecting
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      
      if (!verifySession) {
        setError('Session not established. Please try again.')
        setLoading(false)
        return
      }
      
      // Use window.location for a full page reload to ensure middleware runs
      // This is more reliable than router.push for auth redirects
      window.location.href = returnTo || '/app'
    } else {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sign In</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">Pick up where you left off.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <div className="space-y-2">
              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[var(--accent)] hover:opacity-90"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center text-sm text-[var(--text-muted)]">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[var(--accent)] hover:opacity-90">
              Sign up
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center px-4 min-h-[calc(100vh-4rem)]">
          <Card className="w-full max-w-md p-8">
            <div className="text-center">Loading...</div>
          </Card>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}


