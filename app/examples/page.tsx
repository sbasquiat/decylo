import Link from 'next/link'
import AuthNavbar from '@/components/AuthNavbar'
import { Button } from '@/components/ui/Button'

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <AuthNavbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text)]">
              Example: Job Offer Decision
            </h1>
            <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
              See how Decylo works end-to-end with a real decision.
            </p>
          </div>

          {/* Decision Context */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">The Decision</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Title</div>
                <div className="text-base text-[var(--text)]">Should I take the job offer?</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Context</div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  I've been offered a senior role at a growing startup. The salary is competitive, 
                  but I'd be leaving a stable position. The new role offers more growth potential 
                  and equity, but comes with more risk and uncertainty.
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Success Criteria</div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Long-term career growth, financial security, work-life balance, and alignment with personal values.
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">Options Evaluated</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-sm font-semibold text-[var(--text)] mb-2">Option A: Take the offer</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Impact</span>
                    <span className="text-[var(--text)] font-semibold">8/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Effort</span>
                    <span className="text-[var(--text)] font-semibold">7/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Risk</span>
                    <span className="text-[var(--text)] font-semibold">6/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Confidence</span>
                    <span className="text-[var(--text)] font-semibold">75%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-sm font-semibold text-[var(--text)] mb-2">Option B: Decline & keep searching</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Impact</span>
                    <span className="text-[var(--text)] font-semibold">7/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Effort</span>
                    <span className="text-[var(--text)] font-semibold">6/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Risk</span>
                    <span className="text-[var(--text)] font-semibold">7/10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Confidence</span>
                    <span className="text-[var(--text)] font-semibold">70%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decision Made */}
          <div className="rounded-2xl border border-[rgba(79,124,255,0.25)] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">Decision Made</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Chosen</div>
                <div className="text-base text-[var(--text)] font-semibold">Option A: Take the offer</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Reasoning</div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  The growth potential and equity upside outweigh the risk. The startup is well-funded 
                  and the team is strong. I can always return to a more stable role if needed, but 
                  this opportunity won't wait.
                </div>
              </div>
            </div>
          </div>

          {/* Outcome (Logged Later) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--text)]">Outcome (Logged 3 months later)</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">What Happened</div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Took the offer. First month was challenging but exciting. By month 3, I'm leading 
                  a key project and the equity value has increased. Work-life balance is better than 
                  expected. The team culture is strong.
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">What I Learned</div>
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  My confidence was well-calibrated. The risk felt higher than it actually was. 
                  The growth opportunity is real, and I'm learning faster than in my previous role.
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] mb-1">Result</div>
                <div className="text-base text-[var(--text)] font-semibold">Win</div>
              </div>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6">
            <div className="text-center space-y-4">
              <p className="text-sm leading-relaxed text-white/80">
                The point isn't the "right" answer — it's calibration, follow-through, and learning. 
                Decylo helps you track whether your confidence matches reality over time.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button className="w-full sm:w-auto">
                    Try Decylo
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    Learn more
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

