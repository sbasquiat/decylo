'use client'

import { useEffect, useState } from 'react'

interface InsightFeedback {
  message: string
  type: 'positive' | 'neutral' | 'warning'
}

export default function InsightFeedbackToast() {
  const [feedback, setFeedback] = useState<InsightFeedback | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleInsightFeedback = (event: CustomEvent<InsightFeedback>) => {
      setFeedback(event.detail)
      setIsVisible(true)
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setFeedback(null), 300) // Wait for fade out
      }, 5000)
    }

    window.addEventListener('insightFeedback', handleInsightFeedback as EventListener)

    return () => {
      window.removeEventListener('insightFeedback', handleInsightFeedback as EventListener)
    }
  }, [])

  if (!feedback || !isVisible) return null

  const bgColor =
    feedback.type === 'positive'
      ? 'bg-[rgba(59,214,113,0.12)] border-[rgba(59,214,113,0.25)]'
      : feedback.type === 'warning'
      ? 'bg-[rgba(255,176,32,0.12)] border-[rgba(255,176,32,0.25)]'
      : 'bg-[var(--surface-elevated)] border-[var(--border)]'

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-5">
      <div className={`rounded-2xl border p-4 shadow-lg ${bgColor}`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">{feedback.message}</p>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}


