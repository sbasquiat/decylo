'use client'

import { Card, CardBody } from './ui/Card'
import { calculateJudgmentGrowth, getOutcomesInDateRange } from '@/lib/insights'
import { Outcome } from '@/lib/db/types'
import { subDays } from 'date-fns'

interface WeeklyInsightBannerProps {
  outcomes: Outcome[]
  isVisible: boolean
  onDismiss: () => void
}

export default function WeeklyInsightBanner({ outcomes, isVisible, onDismiss }: WeeklyInsightBannerProps) {
  if (!isVisible || outcomes.length < 4) return null

  const now = new Date()
  const last14DaysStart = subDays(now, 14)
  const previous14DaysStart = subDays(now, 28)
  const previous14DaysEnd = subDays(now, 14)

  const recentOutcomes = getOutcomesInDateRange(outcomes, last14DaysStart, now)
  const previousOutcomes = getOutcomesInDateRange(outcomes, previous14DaysStart, previous14DaysEnd)

  if (recentOutcomes.length < 3 || previousOutcomes.length < 3) return null

  const growthRate = calculateJudgmentGrowth(recentOutcomes, previousOutcomes)

  if (growthRate <= 0) return null // Only show positive growth

  const growthPercent = Math.round(growthRate * 100)

  return (
    <Card className="mb-6 border-[rgba(59,214,113,0.25)] bg-[rgba(59,214,113,0.12)]">
      <CardBody>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text)]">
            Over the last 14 days, your judgment has improved by {growthPercent}%.
          </p>
          <button
            onClick={onDismiss}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </CardBody>
    </Card>
  )
}


