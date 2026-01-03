'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button, PrimaryButton } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { PasswordInput } from '@/components/ui/PasswordInput'
import AuthNavbar from '@/components/AuthNavbar'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnTo = searchParams.get('returnTo') || '/app'

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      // Redirect to returnTo or /app
      router.push(returnTo)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AuthNavbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader
            title="Sign in"
            subtitle="Welcome back to Decylo"
          />
          <CardBody>
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)]">
                  <p className="text-sm text-[var(--danger)]">{error}</p>
                </div>
              )}

              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[var(--accent)] hover:opacity-90"
                >
                  Forgot password?
                </Link>
              </div>

              <PrimaryButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </PrimaryButton>

              <div className="text-center text-sm text-[var(--text-muted)]">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[var(--accent)] hover:opacity-90">
                  Create account
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

