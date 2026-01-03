'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import PaywallModal from '@/components/PaywallModal'
import jsPDF from 'jspdf'

export default function SettingsPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [managingSubscription, setManagingSubscription] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setIsPro(profile.is_pro || false)
      }
    }

    loadProfile()

    // Check for success/cancel query params from Stripe redirect
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setUpgradeSuccess(true)
      // Wait a moment for webhook to process, then refresh
      setTimeout(() => {
        loadProfile()
        router.replace('/app/settings') // Remove query params
        // Hide success message after 5 seconds
        setTimeout(() => setUpgradeSuccess(false), 5000)
      }, 2000)
    } else if (params.get('canceled') === 'true') {
      router.replace('/app/settings') // Remove query params
    }
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('profiles')
      .update({ display_name: displayName || null })
      .eq('id', user.id)

    setSaving(false)
  }

  const fetchDecisions = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { decisions: null, outcomes: null }

    const { data: decisions } = await supabase
      .from('decisions')
      .select('*, options(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!decisions) return { decisions: null, outcomes: null }

    const decisionIds = decisions.map((d: any) => d.id)
    const { data: outcomes } = decisionIds.length > 0
      ? await supabase
          .from('outcomes')
          .select('*')
          .in('decision_id', decisionIds)
      : { data: null }

    return { decisions, outcomes: outcomes || [] }
  }

  const handleExportCSV = async () => {
    if (!isPro) {
      setShowPaywall(true)
      console.log('paywall_shown', { reason: 'export' })
      return
    }

    setExporting(true)
    const { decisions, outcomes } = await fetchDecisions()

    if (!decisions) {
      setExporting(false)
      return
    }

    // Create outcome map
    const outcomeMap = new Map()
    outcomes?.forEach((outcome: any) => {
      outcomeMap.set(outcome.decision_id, outcome)
    })

    // Convert to CSV
    const headers = [
      'Date',
      'Title',
      'Category',
      'Status',
      'Context',
      'Constraints',
      'Chosen Option',
      'Decision Rationale',
      'Predicted Outcome (Positive)',
      'Predicted Outcome (Negative)',
      'Confidence',
      'Next Action',
      'Next Action Due Date',
      'Options',
      'Outcome',
      'Outcome Score',
      'What Happened',
      'Learning',
    ]

    const rows = decisions.map((decision: any) => {
      const chosenOption = decision.options?.find(
        (opt: any) => opt.id === decision.chosen_option_id
      )
      const optionsList = decision.options
        ?.map((opt: any) => {
          const displayScore = Math.round((opt.total_score_int / 10) * 10) / 10
          return `${opt.label} (Score: ${displayScore})`
        })
        .join('; ')

      const outcome = outcomeMap.get(decision.id)
      const outcomeStatus = outcome
        ? outcome.outcome_score_int === 1
          ? 'Won'
          : outcome.outcome_score_int === 0
          ? 'Neutral'
          : 'Lost'
        : ''

      return [
        decision.date,
        decision.title,
        decision.category,
        decision.status,
        decision.context,
        decision.constraints || '',
        chosenOption?.label || '',
        decision.decision_rationale || '',
        decision.predicted_outcome_positive || '',
        decision.predicted_outcome_negative || '',
        decision.confidence_int || '',
        decision.next_action || '',
        decision.next_action_due_date || '',
        optionsList || '',
        outcomeStatus,
        outcome?.outcome_score_int !== undefined ? outcome.outcome_score_int : '',
        outcome?.outcome_reflection_text || '',
        outcome?.learning_reflection_text || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decisions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    setExporting(false)
  }

  const handleExportPDF = async () => {
    if (!isPro) {
      setShowPaywall(true)
      console.log('paywall_shown', { reason: 'export' })
      return
    }

    setExportingPDF(true)
    const { decisions, outcomes } = await fetchDecisions()

    if (!decisions || decisions.length === 0) {
      setExportingPDF(false)
      return
    }

    // Create outcome map
    const outcomeMap = new Map()
    outcomes?.forEach((outcome: any) => {
      outcomeMap.set(outcome.decision_id, outcome)
    })

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    const lineHeight = 6
    let yPos = margin
    let pageNumber = 1

    // Color scheme (RGB tuples for jsPDF)
    const colors = {
      primary: [79, 124, 255] as [number, number, number], // #4F7CFF
      success: [59, 214, 113] as [number, number, number], // #3BD671
      warning: [255, 176, 32] as [number, number, number], // #FFB020
      danger: [255, 93, 93] as [number, number, number], // #FF5D5D
      text: [30, 30, 30] as [number, number, number],
      textMuted: [120, 120, 120] as [number, number, number],
      bgLight: [248, 249, 250] as [number, number, number],
      border: [230, 230, 230] as [number, number, number],
    }

    // Add page header
    const addPageHeader = () => {
      // Header background
      doc.setFillColor(...colors.bgLight)
      doc.rect(0, 0, pageWidth, 30, 'F')
      
      // Logo/Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.primary)
      doc.text('Decylo', margin, 18)
      
      // Subtitle
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.textMuted)
      doc.text('Decision Export', margin + 30, 18)
      
      // Export date (right aligned)
      doc.text(
        `Exported: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        pageWidth - margin,
        18,
        { align: 'right' }
      )
      
      // Header line
      doc.setDrawColor(...colors.primary)
      doc.setLineWidth(0.5)
      doc.line(margin, 25, pageWidth - margin, 25)
    }

    // Add page footer
    const addPageFooter = () => {
      const footerY = pageHeight - 10
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.textMuted)
      doc.text(
        `Page ${pageNumber}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      )
    }

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin - 15) {
        addPageFooter()
        doc.addPage()
        pageNumber++
        yPos = margin + 20
        addPageHeader()
      }
    }

    // Add section box helper
    const addSectionBox = (title: string, content: string, bgColor?: number[]) => {
      checkPageBreak(30)
      
      const boxPadding = 5
      const boxY = yPos
      const titleHeight = 8
      const contentLines = doc.splitTextToSize(content, contentWidth - boxPadding * 2)
      const contentHeight = contentLines.length * lineHeight
      const boxHeight = titleHeight + contentHeight + boxPadding * 2
      
      // Box background
      if (bgColor) {
        doc.setFillColor(...(bgColor as [number, number, number]))
        doc.rect(margin, boxY, contentWidth, boxHeight, 'F')
      }
      
      // Box border
      doc.setDrawColor(...colors.border)
      doc.setLineWidth(0.3)
      doc.rect(margin, boxY, contentWidth, boxHeight)
      
      // Title
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(title, margin + boxPadding, boxY + titleHeight - 2)
      
      // Content
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.text)
      doc.text(contentLines, margin + boxPadding, boxY + titleHeight + boxPadding)
      
      yPos += boxHeight + 8
    }

    // Add colored badge
    const addBadge = (text: string, color: number[], x: number, y: number) => {
      const textWidth = doc.getTextWidth(text)
      const badgeWidth = textWidth + 6
      const badgeHeight = 5
      
      doc.setFillColor(...(color as [number, number, number]))
      doc.roundedRect(x, y - badgeHeight, badgeWidth, badgeHeight, 1, 1, 'F')
      
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(text, x + 3, y - 1.5)
    }

    // Initial page header
    addPageHeader()
    yPos = margin + 30

    // Cover page
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...colors.text)
    doc.text('My Decisions', margin, yPos)
    yPos += lineHeight * 2

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...colors.textMuted)
    doc.text(`A complete record of ${decisions.length} decision${decisions.length !== 1 ? 's' : ''}`, margin, yPos)
    yPos += lineHeight * 3

    doc.setFontSize(10)
    doc.setTextColor(...colors.text)
    const statsText = [
      `Total Decisions: ${decisions.length}`,
      `Completed: ${outcomes?.length || 0}`,
      `Export Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    ]
    statsText.forEach((stat) => {
      doc.text(stat, margin, yPos)
      yPos += lineHeight * 1.2
    })

    yPos += lineHeight * 2
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += lineHeight * 2

    // Decisions
    decisions.forEach((decision: any, index: number) => {
      checkPageBreak(50)

      // Decision number badge
      doc.setFillColor(...colors.primary)
      doc.roundedRect(margin, yPos - 6, 40, 8, 2, 2, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text(`Decision ${index + 1}`, margin + 5, yPos)
      yPos += 12

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      const titleLines = doc.splitTextToSize(decision.title, contentWidth)
      doc.text(titleLines, margin, yPos)
      yPos += titleLines.length * lineHeight * 1.5 + 3

      // Metadata row
      const metadataY = yPos
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.textMuted)
      
      // Category badge
      const categoryText = decision.category.charAt(0).toUpperCase() + decision.category.slice(1).replace('_', ' ')
      addBadge(categoryText, colors.primary, margin, yPos + 3)
      
      // Status badge
      const statusColor = decision.status === 'completed' 
        ? colors.success 
        : decision.status === 'decided' 
        ? colors.warning 
        : colors.textMuted
      const statusText = decision.status.charAt(0).toUpperCase() + decision.status.slice(1)
      addBadge(statusText, statusColor, margin + 50, yPos + 3)
      
      // Date
      doc.text(`Date: ${decision.date}`, margin + 110, yPos + 2)
      yPos += 10

      // Divider
      doc.setDrawColor(...colors.border)
      doc.setLineWidth(0.3)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 8

      // Context
      if (decision.context) {
        addSectionBox('Context', decision.context, [248, 249, 250])
      }

      // Success Outcome
      if (decision.success_outcome) {
        addSectionBox('Success looks like', decision.success_outcome, [235, 250, 240])
      }

      // Constraints
      if (decision.constraints) {
        addSectionBox('Constraints', decision.constraints)
      }

      // Risky Assumption
      if (decision.risky_assumption) {
        addSectionBox('Risky Assumption', decision.risky_assumption, [255, 248, 235])
      }

      // Options
      if (decision.options && decision.options.length > 0) {
        checkPageBreak(40)
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.text)
        doc.text('Options Considered', margin, yPos)
        yPos += 8

        decision.options.forEach((opt: any, optIndex: number) => {
          checkPageBreak(25)
          
          const displayScore = Math.round((opt.total_score_int / 10) * 10) / 10
          const isChosen = opt.id === decision.chosen_option_id
          
          // Option box
          const optionBoxY = yPos
          const optionBoxHeight = 20
          
          // Highlight chosen option
          if (isChosen) {
            doc.setFillColor(79, 124, 255, 10)
            doc.roundedRect(margin, optionBoxY, contentWidth, optionBoxHeight, 2, 2, 'F')
          }
          
          // Border
          doc.setDrawColor(...(isChosen ? colors.primary : colors.border))
          doc.setLineWidth(isChosen ? 1 : 0.3)
          doc.roundedRect(margin, optionBoxY, contentWidth, optionBoxHeight, 2, 2)
          
          // Option label
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...colors.text)
          const chosenPrefix = isChosen ? '✓ ' : ''
          doc.text(`${chosenPrefix}${opt.label}`, margin + 5, optionBoxY + 7)
          
          // Score badge
          const scoreText = `Score: ${displayScore}`
          const scoreWidth = doc.getTextWidth(scoreText)
          addBadge(scoreText, isChosen ? colors.primary : colors.textMuted, pageWidth - margin - scoreWidth - 6, optionBoxY + 3)
          
          // Metrics
          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...colors.textMuted)
          const metricsText = `Impact: ${opt.impact_int} | Effort: ${opt.effort_int} | Risk: ${opt.risk_int}`
          doc.text(metricsText, margin + 5, optionBoxY + 15)
          
          if (opt.notes) {
            const notesLines = doc.splitTextToSize(opt.notes, contentWidth - 10)
            doc.setFontSize(8)
            doc.text(notesLines, margin + 5, optionBoxY + 22)
            yPos += notesLines.length * lineHeight
          }
          
          yPos += optionBoxHeight + 5
        })
        yPos += 5
      }

      // Decision Rationale
      if (decision.decision_rationale) {
        addSectionBox('Why this option was chosen', decision.decision_rationale, [240, 245, 255])
      }

      // Predicted Outcomes
      if (decision.predicted_outcome_positive || decision.predicted_outcome_negative) {
        checkPageBreak(30)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.text)
        doc.text('Predicted Outcomes', margin, yPos)
        yPos += 8

        if (decision.predicted_outcome_positive) {
          addSectionBox('If it goes well', decision.predicted_outcome_positive, [235, 250, 240])
        }

        if (decision.predicted_outcome_negative) {
          addSectionBox('If it goes badly', decision.predicted_outcome_negative, [255, 240, 240])
        }
      }

      // Confidence
      if (decision.confidence_int !== null) {
        checkPageBreak(20)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.text)
        doc.text('Confidence', margin, yPos)
        yPos += 6
        
        // Confidence bar
        const barWidth = contentWidth
        const barHeight = 6
        const confidenceWidth = (decision.confidence_int / 100) * barWidth
        
        // Background
        doc.setFillColor(...colors.bgLight)
        doc.roundedRect(margin, yPos, barWidth, barHeight, 1, 1, 'F')
        
        // Fill
        const confidenceColor = decision.confidence_int >= 70 
          ? colors.success 
          : decision.confidence_int >= 40 
          ? colors.warning 
          : colors.danger
        doc.setFillColor(...(confidenceColor as [number, number, number]))
        doc.roundedRect(margin, yPos, confidenceWidth, barHeight, 1, 1, 'F')
        
        // Text
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.text)
        doc.text(`${decision.confidence_int}%`, margin + barWidth / 2, yPos + 4.5, { align: 'center' })
        
        yPos += barHeight + 8
      }

      // Next Action
      if (decision.next_action) {
        addSectionBox('Next Action', decision.next_action + (decision.next_action_due_date ? ` (Due: ${decision.next_action_due_date})` : ''))
      }

      // Outcome
      const outcome = outcomeMap.get(decision.id)
      if (outcome) {
        checkPageBreak(50)
        yPos += 5
        
        // Outcome header with colored background
        const outcomeHeaderHeight = 10
        const outcomeStatus = outcome.outcome_score_int === 1 
          ? 'Won' 
          : outcome.outcome_score_int === 0 
          ? 'Neutral' 
          : 'Lost'
        
        const outcomeColor = outcome.outcome_score_int === 1 
          ? colors.success 
          : outcome.outcome_score_int === 0 
          ? colors.warning 
          : colors.danger
        
        doc.setFillColor(...(outcomeColor as [number, number, number]))
        doc.roundedRect(margin, yPos, contentWidth, outcomeHeaderHeight, 2, 2, 'F')
        
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(`Outcome: ${outcomeStatus}`, margin + 5, yPos + 7)
        
        yPos += outcomeHeaderHeight + 5

        if (outcome.outcome_reflection_text) {
          addSectionBox('What Happened', outcome.outcome_reflection_text)
        }

        if (outcome.learning_reflection_text) {
          addSectionBox('What I Learned', outcome.learning_reflection_text, [240, 250, 255])
        }

        if (outcome.self_reflection_text) {
          addSectionBox('What this taught me about myself', outcome.self_reflection_text, [255, 248, 240])
        }
      }

      // Decision separator
      if (index < decisions.length - 1) {
        checkPageBreak(15)
        yPos += 5
        doc.setDrawColor(...colors.border)
        doc.setLineWidth(0.5)
        doc.setLineDashPattern([5, 5], 0)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        doc.setLineDashPattern([], 0)
        yPos += 10
      }
    })

    // Final page footer
    addPageFooter()

    // Save PDF
    doc.save(`decylo-decisions-${new Date().toISOString().split('T')[0]}.pdf`)
    setExportingPDF(false)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleManageSubscription = async () => {
    setManagingSubscription(true)
    setSubscriptionError(null)
    try {
      const response = await fetch('/api/stripe/portal')
      const data = await response.json()
      
      if (!response.ok) {
        setSubscriptionError(data.error || 'Failed to open subscription portal')
        setManagingSubscription(false)
        return
      }
      
      if (data.url) {
        window.location.href = data.url
      } else {
        setSubscriptionError('No portal URL received')
        setManagingSubscription(false)
      }
    } catch (error) {
      console.error('Portal error:', error)
      setSubscriptionError('Failed to open subscription portal. Please try again.')
      setManagingSubscription(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/app"
            className="text-sm text-[var(--accent)] hover:opacity-90 mb-4 inline-block"
          >
            ← Back to Today
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage your account and preferences</p>
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <Card>
            <CardHeader title="Profile" />
            <CardBody>
              <div className="space-y-4">
                <TextInput
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <Button onClick={handleSave} disabled={saving || loading}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader title="Subscription" />
            <CardBody>
              <div className="space-y-4">
                {upgradeSuccess && (
                  <div className="p-4 rounded-xl bg-[rgba(59,214,113,0.12)] border border-[rgba(59,214,113,0.30)]">
                    <p className="text-sm text-[var(--success)]">
                      Upgrade successful! Your Pro subscription is now active. Check your email for confirmation.
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold mb-1">Current Plan</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {isPro ? 'Pro (€10/month)' : 'Free'}
                  </p>
                </div>
                {isPro && (
                  <div className="space-y-2">
                    <Button 
                      variant="secondary" 
                      onClick={handleManageSubscription} 
                      className="w-full"
                      disabled={managingSubscription || loading}
                    >
                      {managingSubscription ? 'Opening...' : 'Manage Subscription'}
                    </Button>
                    {subscriptionError && (
                      <p className="text-xs text-[var(--danger)]">{subscriptionError}</p>
                    )}
                  </div>
                )}
                {!isPro && (
                  <Link href="/pricing" className="block">
                    <Button className="w-full">Unlock Pro Features</Button>
                  </Link>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Export */}
          <Card>
            <CardHeader title="Export" />
            <CardBody>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {isPro
                  ? 'Download all your decisions as CSV or PDF.'
                  : 'Export is a Pro feature. Upgrade to export your decisions.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="secondary" 
                  onClick={handleExportCSV} 
                  disabled={exporting || exportingPDF}
                  className="flex-1"
                >
                  {exporting ? 'Exporting...' : 'Export as CSV'}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleExportPDF} 
                  disabled={exporting || exportingPDF}
                  className="flex-1"
                >
                  {exportingPDF ? 'Exporting...' : 'Export as PDF'}
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardHeader title="Account" />
            <CardBody>
              <Button variant="secondary" onClick={handleSignOut} className="text-[var(--danger)] hover:bg-[var(--danger)]/10">
                Sign Out
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="export"
      />
    </div>
  )
}

