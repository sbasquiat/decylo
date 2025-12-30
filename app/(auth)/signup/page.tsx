'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import PasswordInput from '@/components/ui/PasswordInput'
import { Card } from '@/components/ui/Card'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || null,
        },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })

    if (signUpError) {
      setError(signUpError.message || 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    if (data.user) {
      if (data.session) {
        // User is immediately authenticated (no email confirmation required)
        // Wait a moment for cookies to be set, then do a full page reload
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = '/app'
      } else {
        // Email confirmation required
        setError('')
        setSuccess('Account created! Please check your email to confirm your account, then sign in.')
        setLoading(false)
      }
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
            <h1 className="text-xl font-semibold tracking-tight">Sign Up</h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">Create your Decylo account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              type="text"
              label="Display Name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <TextInput
              type="email"
              label="Email"
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
              autoComplete="new-password"
              minLength={6}
            />

            {error && (
              <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-[var(--success)] bg-[rgba(59,214,113,0.12)] border border-[rgba(59,214,113,0.30)] rounded-xl p-3">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href="/signin" className="text-[var(--accent)] hover:opacity-90">
              Sign in
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}


