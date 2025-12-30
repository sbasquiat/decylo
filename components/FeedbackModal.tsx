'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { TextInput } from './ui/TextInput'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

type FeedbackRating = 'very_helpful' | 'somewhat_helpful' | 'not_helpful'

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const router = useRouter()
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRatingClick = (selectedRating: FeedbackRating) => {
    setRating(selectedRating)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to submit feedback')
        setSubmitting(false)
        return
      }

      // Save feedback
      const { error: feedbackError } = await supabase.from('feedback').insert({
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      })

      if (feedbackError) {
        console.error('Error saving feedback:', feedbackError)
        setError('Failed to save feedback. Please try again.')
        setSubmitting(false)
        return
      }

      // Mark feedback as submitted
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ feedback_submitted: true })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        // Don't fail the whole operation if profile update fails
      }

      // Close modal and refresh
      onClose()
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    // Mark feedback as submitted even if skipped (so it doesn't show again)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ feedback_submitted: true })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error('Error updating profile:', err)
    }

    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">How did that feel?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Did Decylo make this decision easier for you?
            </p>
          </div>

          {error && (
            <div className="text-sm text-[var(--danger)] bg-[rgba(255,93,93,0.12)] border border-[rgba(255,93,93,0.30)] rounded-xl p-3">
              {error}
            </div>
          )}

          {!rating ? (
            <div className="space-y-3">
              <button
                onClick={() => handleRatingClick('very_helpful')}
                className="w-full p-4 text-left rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-white/10 hover:bg-white/5 transition"
              >
                <span className="text-sm font-semibold">Very helpful</span>
              </button>
              <button
                onClick={() => handleRatingClick('somewhat_helpful')}
                className="w-full p-4 text-left rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-white/10 hover:bg-white/5 transition"
              >
                <span className="text-sm font-semibold">Somewhat helpful</span>
              </button>
              <button
                onClick={() => handleRatingClick('not_helpful')}
                className="w-full p-4 text-left rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-white/10 hover:bg-white/5 transition"
              >
                <span className="text-sm font-semibold">Not helpful</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.12)]">
                <p className="text-sm font-semibold">
                  {rating === 'very_helpful'
                    ? 'Very helpful'
                    : rating === 'somewhat_helpful'
                    ? 'Somewhat helpful'
                    : 'Not helpful'}
                </p>
              </div>

              <div>
                <TextInput
                  placeholder="What could be better?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <PrimaryButton onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? 'Sending...' : 'Send feedback'}
                </PrimaryButton>
                <SecondaryButton onClick={handleSkip} className="w-full">
                  Skip
                </SecondaryButton>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}


