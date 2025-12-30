'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { Card } from '@/components/ui/Card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center px-4 min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">We'll email you a reset link.</p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="text-sm text-[var(--success)] bg-[rgba(59,214,113,0.12)] border border-[rgba(59,214,113,0.30)] rounded-xl p-3">
                Check your email for a reset link.
              </div>
              <Link href="/signin">
                <Button className="w-full">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextInput
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email"
              />

              {error && (
                <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-[var(--text-muted)]">
            Remember your password?{' '}
            <Link href="/signin" className="text-[var(--accent)] hover:opacity-90">
              Sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}


