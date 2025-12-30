'use client'

import { Card, CardHeader, CardBody } from './ui/Card'
import { PatternWarning } from '@/lib/bias-reduction'

interface PatternWarningCardProps {
  warning: PatternWarning
}

export default function PatternWarningCard({ warning }: PatternWarningCardProps) {
  const severityColors = {
    low: 'border-[rgba(255,176,32,0.25)] bg-[rgba(255,176,32,0.12)]',
    medium: 'border-[rgba(255,176,32,0.35)] bg-[rgba(255,176,32,0.18)]',
    high: 'border-[rgba(255,93,93,0.25)] bg-[rgba(255,93,93,0.12)]',
  }

  return (
    <Card className={`${severityColors[warning.severity]}`}>
      <CardBody>
        <div className="flex items-start gap-3">
          <div className="text-lg">⚠️</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text)] mb-1">
              {warning.message}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Pattern detected. No advice — just data.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}


