'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  stage: 'welcome' | 'first_decision' | 'first_outcome'
}

export default function OnboardingModal({ isOpen, onClose, stage }: OnboardingModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const getContent = () => {
    switch (stage) {
      case 'welcome':
        return {
          title: 'Welcome to Decylo',
          body: 'Decylo is your daily workspace for making better decisions.\n\nA good decision is not one that feels good — it is one that maximizes long-term value under uncertainty.\n\nDecision Quality measures how accurately you predict the real consequences of your choices — and how often you follow through.\n\nStart with one real decision you are facing right now.',
          primaryCTA: 'Add your first decision',
          secondaryCTA: 'Skip for now',
          primaryAction: () => {
            router.push('/app/new')
            onClose()
          },
        }
      case 'first_decision':
        return {
          title: "Nice. This is where it begins.",
          body: "Return tomorrow and log the outcome. That's how your judgment improves.",
          primaryCTA: 'Got it',
          secondaryCTA: null,
          primaryAction: onClose,
        }
      case 'first_outcome':
        return {
          title: "You've closed your first decision loop.",
          body: "Decylo doesn't just track choices — it helps you learn from them.\nKeep using it daily. Your future decisions will get easier.",
          primaryCTA: 'View Insights',
          secondaryCTA: null,
          primaryAction: () => {
            router.push('/app/insights')
            onClose()
          },
        }
      default:
        return {
          title: 'Welcome to Decylo',
          body: 'Decylo is your daily workspace for making better decisions.',
          primaryCTA: 'Get Started',
          secondaryCTA: null,
          primaryAction: onClose,
        }
    }
  }

  const content = getContent()

  const handlePrimary = async () => {
    if (stage === 'welcome') {
      // Mark welcome as shown
      setLoading(true)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase
            .from('profiles')
            .update({ onboarding_welcome_shown: true })
            .eq('id', user.id)
        }
      } catch (error) {
        console.error('Error updating onboarding state:', error)
      } finally {
        setLoading(false)
      }
    }
    content.primaryAction()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{content.title}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] whitespace-pre-line">
              {content.body}
            </p>
          </div>

          <div className="space-y-3">
            <PrimaryButton onClick={handlePrimary} disabled={loading} className="w-full">
              {loading ? 'Loading...' : content.primaryCTA}
            </PrimaryButton>
            {content.secondaryCTA && (
              <SecondaryButton onClick={onClose} className="w-full">
                {content.secondaryCTA}
              </SecondaryButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

