'use client'

import { Card, CardHeader, CardBody } from './ui/Card'
import { DecisionTrajectory } from '@/lib/decision-trajectory'
import { formatCategory } from '@/lib/category-format'
import { DecisionCategory } from '@/lib/db/types'

interface TrajectoryCardProps {
  trajectory: DecisionTrajectory | null
  decisionHealth: number
}

export default function TrajectoryCard({
  trajectory,
  decisionHealth,
}: TrajectoryCardProps) {
  if (!trajectory) {
    return null
  }

  return (
    <Card>
      <CardHeader 
        title="Decision Trajectory" 
        subtitle="Am I actually becoming better at life?"
      />
      <CardBody>
        <div className="space-y-6">
          {/* Decision Health Index (DHI) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text)]">Decision Health Index</span>
              <span className="text-sm font-semibold text-[var(--text)]">
                {trajectory.dhi.score}/100
              </span>
            </div>
            <div className="h-3 rounded-full bg-[var(--surface-elevated)] overflow-hidden mb-3">
              <div
                className="h-full bg-[var(--primary)] transition-all"
                style={{ width: `${trajectory.dhi.score}%` }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[var(--text-muted)]">PA</span>
                <p className="font-semibold">{Math.round(trajectory.dhi.components.predictionAccuracy * 100)}%</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">FT</span>
                <p className="font-semibold">{Math.round(trajectory.dhi.components.followThroughRate * 100)}%</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">RI</span>
                <p className="font-semibold">{Math.round(((trajectory.dhi.components.riskIntelligence + 1) / 2) * 100)}%</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">GM</span>
                <p className="font-semibold">{trajectory.dhi.components.growthMomentum > 0 ? '+' : ''}{trajectory.dhi.components.growthMomentum.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Trajectory Momentum Score (TMS) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[var(--text)]">Trajectory Momentum</span>
              <span className={`text-sm font-semibold ${
                trajectory.tms.status === 'accelerating'
                  ? 'text-[rgba(59,214,113,0.9)]'
                  : trajectory.tms.status === 'declining'
                  ? 'text-[rgba(255,93,93,0.9)]'
                  : 'text-[var(--text-muted)]'
              }`}>
                {trajectory.tms.status === 'accelerating' ? '↑' : trajectory.tms.status === 'declining' ? '↓' : '→'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {trajectory.tms.message}
            </p>
          </div>

          {/* Domain Strength Index */}
          {trajectory.domainStrengths.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--text)]">Domain Strength Index</span>
              </div>
              <div className="space-y-3">
                {trajectory.domainStrengths.slice(0, 3).map((domain, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text)]">
                        {formatCategory(domain.category)}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {domain.score}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] transition-all"
                        style={{ width: `${domain.score}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted-2)]">
                      <span>Win: {Math.round(domain.winRate * 100)}%</span>
                      <span>FT: {Math.round(domain.followThrough * 100)}%</span>
                      <span>PA: {Math.round(domain.predictionAccuracy * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {trajectory.domainStrengths.length > 3 && (
                <p className="text-xs text-[var(--text-muted-2)] mt-2">
                  +{trajectory.domainStrengths.length - 3} more domains
                </p>
              )}
            </div>
          )}

          {/* Prediction Calibration Curve */}
          {trajectory.calibrationCurve.some((c) => c.gap > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--text)]">Prediction Calibration Curve</span>
              </div>
              <div className="space-y-2">
                {trajectory.calibrationCurve.map((bucket, idx) => {
                  if (bucket.predictedFrequency === 0 && bucket.actualFrequency === 0) return null
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">{bucket.confidenceBucket}% confidence</span>
                        <span className={`text-[var(--text-muted)] ${
                          bucket.gap < 0.15 ? 'text-[rgba(59,214,113,0.9)]' : 'text-[rgba(255,93,93,0.9)]'
                        }`}>
                          Gap: {Math.round(bucket.gap * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                          <div
                            className="h-full bg-[rgba(79,124,255,0.3)] transition-all"
                            style={{ width: `${bucket.predictedFrequency * 100}%` }}
                            title={`Predicted: ${Math.round(bucket.predictedFrequency * 100)}%`}
                          />
                        </div>
                        <div className="flex-1 h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              bucket.gap < 0.15 ? 'bg-[rgba(59,214,113,0.6)]' : 'bg-[rgba(255,93,93,0.6)]'
                            }`}
                            style={{ width: `${bucket.actualFrequency * 100}%` }}
                            title={`Actual: ${Math.round(bucket.actualFrequency * 100)}%`}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-[var(--text-muted-2)] mt-2">
                Left: Predicted win rate | Right: Actual win rate
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
