'use client'

import { Card, CardHeader, CardBody } from './ui/Card'
import { CategoryCalibration, formatCategoryCalibrationMessage } from '@/lib/bias-reduction'

interface CategoryCalibrationInsightProps {
  calibration: CategoryCalibration
}

export default function CategoryCalibrationInsight({ calibration }: CategoryCalibrationInsightProps) {
  const message = formatCategoryCalibrationMessage(calibration)

  return (
    <Card>
      <CardBody>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--text)]">
            {message}
          </p>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>Avg gap: {calibration.avgCalibrationGap.toFixed(1)}%</span>
            <span>{calibration.sampleSize} decisions</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}


