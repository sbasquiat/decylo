'use client'

import { useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: () => void
}

type OnboardingScreen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export default function OnboardingFlow({ isOpen, onComplete }: OnboardingFlowProps) {
  const router = useRouter()
  const [currentScreen, setCurrentScreen] = useState<OnboardingScreen>(1)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const getScreenContent = (screen: OnboardingScreen) => {
    switch (screen) {
      case 1:
        return {
          title: 'Welcome to Decylo',
          subtitle: 'Train your judgment.\nMake better decisions.\nCompound your life.',
          body: 'Decylo turns everyday decisions into measurable learning.\nOver time, your thinking improves.',
          cta: 'Get started',
        }
      case 2:
        return {
          title: 'Most people never learn from their decisions.',
          subtitle: null,
          body: 'You make hundreds of choices every week.\nAlmost none of them teach you anything.\n\nDecylo closes that loop.',
          cta: 'Show me how',
        }
      case 3:
        return {
          title: 'This is the Decylo Loop',
          subtitle: 'Think → Choose → Act → Review → Improve',
          body: 'Every decision becomes an experiment.\nYou predict what will happen.\nThen you measure what actually happens.\n\nYour judgment compounds.',
          cta: 'Continue',
        }
      case 4:
        return {
          title: "You don't score feelings. You model reality.",
          subtitle: null,
          body: 'Impact — How much your life improves\nEffort — How hard it is to execute\nRisk — How bad the downside is\n\nDecylo combines them into a clear option score.',
          cta: 'Next',
        }
      case 5:
        return {
          title: 'Decylo measures your judgment.',
          subtitle: null,
          body: 'Not productivity.\nNot habits.\n\nYour ability to predict outcomes and follow through.\n\nThis becomes your Decision Health.',
          cta: 'Next',
        }
      case 6:
        return {
          title: 'What gets measured gets better.',
          subtitle: null,
          body: "After enough decisions, Decylo reveals:\n• your strengths\n• your blind spots\n• how fast your thinking is improving\n\nThat's your Judgment Profile.",
          cta: 'Continue',
        }
      case 7:
        return {
          title: 'If you close the loop, your life changes.',
          subtitle: null,
          body: "The only rule:\nWhen you decide, come back and log the outcome.\n\nThat's where growth happens.",
          cta: "I'm in",
        }
      case 8:
        return {
          title: "Let's train your first decision.",
          subtitle: null,
          body: "Think of a real choice you're facing right now.\n\nBig or small.\nImportant or ordinary.\n\nIt's all training.",
          cta: 'Create my first decision',
        }
      default:
        return {
          title: 'Welcome to Decylo',
          subtitle: null,
          body: 'Decylo turns everyday decisions into measurable learning.',
          cta: 'Get started',
        }
    }
  }

  const handleNext = async () => {
    if (currentScreen === 8) {
      // Mark onboarding as complete
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

      // Navigate to new decision page
      router.push('/app/new')
      onComplete()
    } else {
      setCurrentScreen((prev) => (prev + 1) as OnboardingScreen)
    }
  }

  const handleSkip = () => {
    // Mark onboarding as shown (user skipped)
    setLoading(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .update({ onboarding_welcome_shown: true })
          .eq('id', user.id)
          .then(() => {
            setLoading(false)
            onComplete()
          })
      } else {
        setLoading(false)
        onComplete()
      }
    })
  }

  const content = getScreenContent(currentScreen)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 <= currentScreen
                    ? 'bg-[var(--primary)] w-8'
                    : 'bg-[var(--surface-elevated)] w-1.5'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
              {content.title}
            </h2>
            {content.subtitle && (
              <p className="text-base font-medium text-[var(--text-muted)] whitespace-pre-line">
                {content.subtitle}
              </p>
            )}
            <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
              {content.body}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <PrimaryButton
              onClick={handleNext}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : content.cta}
            </PrimaryButton>
            {currentScreen === 1 && (
              <SecondaryButton onClick={handleSkip} className="w-full" disabled={loading}>
                Skip for now
              </SecondaryButton>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

