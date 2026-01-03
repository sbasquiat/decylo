'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { PrimaryButton } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { PasswordInput } from '@/components/ui/PasswordInput'
import AuthNavbar from '@/components/AuthNavbar'
import Link from 'next/link'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      // User will receive email verification link
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <AuthNavbar />
        <div className="flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader
              title="Check your email"
              subtitle="We sent you a verification link"
            />
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  We've sent a verification link to <strong>{email}</strong>. Click the link in the email to verify your account and sign in.
                </p>
                <Link href="/signin">
                  <PrimaryButton className="w-full">
                    Back to sign in
                  </PrimaryButton>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AuthNavbar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader
            title="Create account"
            subtitle="Start making better decisions"
          />
          <CardBody>
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)]">
                  <p className="text-sm text-[var(--danger)]">{error}</p>
                </div>
              )}

              <TextInput
                label="Display name (optional)"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />

              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />

              <PasswordInput
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />

              <PrimaryButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </PrimaryButton>

              <div className="space-y-3 pt-2">
                <div className="text-center text-xs text-[var(--text-muted)]">
                  <div className="mb-2">No credit card. Cancel anytime.</div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link href="/how-it-works" className="text-[var(--accent)] hover:opacity-90">
                      How it works
                    </Link>
                    <span className="text-[var(--text-muted-2)]">·</span>
                    <Link href="/privacy" className="text-[var(--accent)] hover:opacity-90">
                      Privacy
                    </Link>
                  </div>
                  <div className="mt-2 text-[var(--text-muted-2)]">
                    No ads. No data selling.
                  </div>
                </div>

                <div className="text-center text-sm text-[var(--text-muted)]">
                  Already have an account?{' '}
                  <Link href="/signin" className="text-[var(--accent)] hover:opacity-90">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

