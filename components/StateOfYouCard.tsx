'use client'

import { Card, CardHeader, CardBody } from './ui/Card'
import { StateOfYouProfile } from '@/lib/state-of-you'

interface StateOfYouCardProps {
  profile: StateOfYouProfile | null
}

export default function StateOfYouCard({ profile }: StateOfYouCardProps) {
  if (!profile) {
    return null
  }

  return (
    <Card className="border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.05)]">
      <CardHeader 
        title="Your Current Decision Profile" 
        subtitle="Auto-generated from your decision patterns"
      />
      <CardBody>
        <p className="text-sm text-[var(--text)] leading-relaxed mb-4">
          {profile.text}
        </p>
        
        {profile.strengths.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Strengths</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1">
              {profile.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-[rgba(59,214,113,0.8)]">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.growthAreas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Growth Areas</p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1">
              {profile.growthAreas.map((area, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-[rgba(255,176,32,0.8)]">→</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  )
}


