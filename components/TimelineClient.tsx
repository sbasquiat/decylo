'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from './ui/StatusBadge'
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import PaywallModal from './PaywallModal'
import { TextInput } from './ui/TextInput'
import { DecisionCategory, DecisionStatus } from '@/lib/db/types'
import { computeDecisionStatus } from '@/lib/decision-status'
import { formatCategory } from '@/lib/category-format'

// Client-side helper (duplicated from lib/subscription.ts to avoid server/client mixing)
function isWithinFreeTier(date: string | Date): boolean {
  const decisionDate = typeof date === 'string' ? new Date(date) : date
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  decisionDate.setHours(0, 0, 0, 0)
  return decisionDate >= sevenDaysAgo
}

interface TimelineClientProps {
  decisions: Array<any & { outcome?: any | null }>
  isPro: boolean
}

export default function TimelineClient({ decisions, isPro }: TimelineClientProps) {
  const router = useRouter()
  const [showPaywall, setShowPaywall] = useState(false)
  const [lockedDecisions, setLockedDecisions] = useState<any[]>([])
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<DecisionCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<DecisionStatus | 'all'>('all')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((decision) => {
      // Search filter (title or context)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = decision.title?.toLowerCase().includes(query)
        const matchesContext = decision.context?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesContext) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && decision.category !== selectedCategory) {
        return false
      }

      // Status filter (use computed status)
      if (selectedStatus !== 'all') {
        const computedStatus = computeDecisionStatus(decision, decision.outcome || null)
        if (computedStatus !== selectedStatus) {
          return false
        }
      }

      // Date range filter
      if (dateRangeStart || dateRangeEnd) {
        const decisionDate = parseISO(decision.date)
        if (dateRangeStart) {
          const startDate = startOfDay(parseISO(dateRangeStart))
          if (isBefore(decisionDate, startDate)) return false
        }
        if (dateRangeEnd) {
          const endDate = endOfDay(parseISO(dateRangeEnd))
          if (isAfter(decisionDate, endDate)) return false
        }
      }

      return true
    })
  }, [decisions, searchQuery, selectedCategory, selectedStatus, dateRangeStart, dateRangeEnd])

  // Group filtered decisions by date
  const grouped: Record<string, typeof filteredDecisions> = {}
  for (const decision of filteredDecisions) {
    const date = decision.date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(decision)
  }

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setDateRangeStart('')
    setDateRangeEnd('')
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || dateRangeStart || dateRangeEnd

  const handleDecisionClick = (decision: any) => {
    if (!isPro && !isWithinFreeTier(decision.date)) {
      setLockedDecisions([decision])
      setShowPaywall(true)
      console.log('paywall_shown', { reason: 'history' })
      return
    }
    // Navigate using Next.js router
    router.push(`/app/decision/${decision.id}`)
  }

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/app"
              className="text-sm text-[var(--primary)] hover:opacity-90 mb-4 inline-block"
            >
              ← Back to Today
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">Timeline</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {isPro ? 'All your decisions' : 'Last 7 days — Upgrade to Pro to unlock your full decision history'}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <TextInput
              placeholder="Search by title or context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DecisionCategory | 'all')}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                >
                  <option value="all">All categories</option>
                  <option value="career">Career</option>
                  <option value="money">Money</option>
                  <option value="health">Health</option>
                  <option value="relationships">Relationships</option>
                  <option value="life_lifestyle">Life & Lifestyle</option>
                  <option value="growth_learning">Growth & Learning</option>
                  <option value="time_priorities">Time & Priorities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as DecisionStatus | 'all')}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="decided">Decided</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Date Range Start */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
              </div>

              {/* Date Range End */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Results Count */}
            {hasActiveFilters && (
              <p className="text-sm text-[var(--text-muted)]">
                Showing {filteredDecisions.length} of {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => {
                const dateDecisions = grouped[date] || []
                const isLocked = !isPro && !isWithinFreeTier(date)

                return (
                  <div key={date}>
                    <h2 className="text-base font-semibold text-[var(--text-muted)] mb-4">
                      {format(new Date(date), 'MMMM d, yyyy')}
                      {isLocked && (
                        <span className="ml-2 text-xs text-[var(--text-muted)]">
                          (Pro required)
                        </span>
                      )}
                    </h2>
                    <div className="space-y-3">
                      {dateDecisions.map((decision) => {
                        const decisionLocked = !isPro && !isWithinFreeTier(decision.date)

                        return (
                          <div
                            key={decision.id}
                            onClick={() => handleDecisionClick(decision)}
                            className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition ${
                              decisionLocked
                                ? 'opacity-50 blur-sm pointer-events-none'
                                : 'cursor-pointer hover:border-white/10 hover:bg-white/5 active:scale-[0.98]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold">{decision.title}</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                                  {decision.context}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-[var(--text-muted)]">
                                    {formatCategory(decision.category)}
                                  </span>
                                </div>
                              </div>
                              <StatusBadge status={computeDecisionStatus(decision, decision.outcome || null)} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {isLocked && dateDecisions.length > 0 && (
                      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-center">
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                          Unlock full history to view decisions older than 7 days
                        </p>
                        <button
                          onClick={() => {
                            setShowPaywall(true)
                            console.log('paywall_shown', { reason: 'history' })
                          }}
                          className="text-sm font-semibold text-[var(--primary)] hover:opacity-90"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            ) : hasActiveFilters ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                <p className="text-[var(--text-muted)]">No decisions match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="text-[var(--primary)] hover:opacity-90 mt-2 inline-block"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                <p className="text-[var(--text-muted)]">No decisions yet.</p>
                <Link href="/app/new" className="text-[var(--primary)] hover:opacity-90 mt-2 inline-block">
                  Create your first decision
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="history"
      />
    </>
  )
}

