'use client'

import { Card, CardHeader, CardBody } from './ui/Card'
import { JudgmentProfile } from '@/lib/judgment-profile'

interface JudgmentProfileCardProps {
  profile: JudgmentProfile | null
}

export default function JudgmentProfileCard({ profile }: JudgmentProfileCardProps) {
  if (!profile) {
    return null
  }

  return (
    <Card className="border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.05)]">
      <CardHeader 
        title="Judgment Profile" 
        subtitle="What kind of decision-maker are you becoming?"
      />
      <CardBody>
        <div className="space-y-6">
          {/* Archetype */}
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
              {profile.profileText}
            </h3>
            {profile.secondaryTraitText && (
              <p className="text-sm font-medium text-[var(--text-muted)] mb-3">
                {profile.secondaryTraitText}
              </p>
            )}
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {profile.insightNarrative}
            </p>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Prediction Accuracy</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {Math.round(profile.predictionAccuracy * 100)}%
              </p>
              <p className="text-xs text-[var(--text-muted-2)] mt-1">
                {profile.predictionAccuracy >= 0.6 ? 'Well-calibrated' : 'Needs improvement'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Follow-Through</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {Math.round(profile.followThroughRate * 100)}%
              </p>
              <p className="text-xs text-[var(--text-muted-2)] mt-1">
                {profile.followThroughRate >= 0.7 ? 'Disciplined' : 'Inconsistent'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Risk Intelligence</p>
              <p className="text-lg font-semibold text-[var(--text)]">
                {profile.riskIntelligence > 0 ? '+' : ''}{profile.riskIntelligence.toFixed(2)}
              </p>
              <p className="text-xs text-[var(--text-muted-2)] mt-1">
                {profile.riskIntelligence > 0.3 ? 'Strong' : profile.riskIntelligence > 0 ? 'Moderate' : 'Weak'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Growth Momentum</p>
              <p className={`text-lg font-semibold ${
                profile.growthMomentum > 0 
                  ? 'text-[rgba(59,214,113,0.9)]' 
                  : profile.growthMomentum < 0 
                  ? 'text-[rgba(255,93,93,0.9)]' 
                  : 'text-[var(--text-muted)]'
              }`}>
                {profile.growthMomentum > 0 ? '+' : ''}{profile.growthMomentum.toFixed(2)}/day
              </p>
              <p className="text-xs text-[var(--text-muted-2)] mt-1">
                {profile.growthMomentum > 0 ? 'Improving' : profile.growthMomentum < 0 ? 'Declining' : 'Stable'}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

