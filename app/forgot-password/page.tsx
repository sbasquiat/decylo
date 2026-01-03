'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { PrimaryButton } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import AuthNavbar from '@/components/AuthNavbar'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
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
              subtitle="Password reset link sent"
            />
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to reset your password.
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
            title="Reset password"
            subtitle="Enter your email to receive a reset link"
          />
          <CardBody>
            <form onSubmit={handleReset} className="space-y-4">
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
                placeholder="you@example.com"
              />

              <PrimaryButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </PrimaryButton>

              <div className="text-center text-sm text-[var(--text-muted)]">
                <Link href="/signin" className="text-[var(--accent)] hover:opacity-90">
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

