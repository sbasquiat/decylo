'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface EmailPreferences {
  welcome: boolean
  reminders: boolean
  weekly_review: boolean
}

export default function EmailPreferencesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<EmailPreferences>({
    welcome: true,
    reminders: true,
    weekly_review: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)

  useEffect(() => {
    loadPreferences()
    
    // Check if this is an unsubscribe request
    const unsubscribe = searchParams.get('unsubscribe')
    if (unsubscribe === 'true') {
      handleUnsubscribe()
    }
  }, [searchParams])

  const loadPreferences = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email_preferences')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading preferences:', profileError)
        setError('Failed to load preferences')
        return
      }

      if (profile?.email_preferences) {
        setPreferences({
          welcome: profile.email_preferences.welcome !== false,
          reminders: profile.email_preferences.reminders !== false,
          weekly_review: profile.email_preferences.weekly_review !== false,
        })
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      // Unsubscribe from all emails
      const unsubscribePreferences = {
        welcome: false,
        reminders: false,
        weekly_review: false,
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_preferences: unsubscribePreferences,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error unsubscribing:', updateError)
        setError('Failed to unsubscribe')
        return
      }

      setPreferences(unsubscribePreferences)
      setUnsubscribed(true)
      setSuccess(true)
      
      // Remove unsubscribe param from URL
      router.replace('/app/settings/email-preferences', { scroll: false })
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to unsubscribe')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    setUnsubscribed(false)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email_preferences: preferences,
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error saving preferences:', updateError)
        setError('Failed to save preferences')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Card className="p-6">
            <p className="text-[var(--text-muted)]">Loading...</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/app/settings"
            className="text-sm text-[var(--accent)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Settings
          </Link>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Email Preferences</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Control which emails you receive from Decylo.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)]">
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-[rgba(59,214,113,0.12)] border border-[rgba(59,214,113,0.30)]">
                <p className="text-sm text-[var(--success)]">
                  {unsubscribed ? 'You have been unsubscribed from all emails.' : 'Preferences saved.'}
                </p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-start justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
                    Welcome Email
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Sent when you first sign up.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.welcome}
                    onChange={(e) =>
                      setPreferences({ ...preferences, welcome: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgba(79,124,255,0.14)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
                    Outcome Reminders
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Daily reminders to log outcomes for decisions you've made.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.reminders}
                    onChange={(e) =>
                      setPreferences({ ...preferences, reminders: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgba(79,124,255,0.14)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-1">
                    Weekly Review
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Weekly summary of your decisions and judgment trends.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.weekly_review}
                    onChange={(e) =>
                      setPreferences({ ...preferences, weekly_review: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--surface)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgba(79,124,255,0.14)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

