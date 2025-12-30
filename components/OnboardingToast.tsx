'use client'

import { useEffect, useState } from 'react'
import { Card } from './ui/Card'
import { PrimaryButton } from './ui/Button'
import { useRouter } from 'next/navigation'

interface OnboardingToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body: string
  cta: string
  onCTA?: () => void
}

export default function OnboardingToast({
  isOpen,
  onClose,
  title,
  body,
  cta,
  onCTA,
}: OnboardingToastProps) {
  if (!isOpen) return null

  const handleCTA = () => {
    if (onCTA) {
      onCTA()
    }
    onClose()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="p-4 border-[rgba(79,124,255,0.25)] bg-[var(--surface)] shadow-lg">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] whitespace-pre-line">{body}</p>
          </div>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={handleCTA} className="flex-1 text-xs h-9">
              {cta}
            </PrimaryButton>
            <button
              onClick={onClose}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-2"
            >
              ×
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

