import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'How to Use Decylo Properly',
  description: 'The complete guide to using Decylo effectively. Learn how to score honestly, avoid bias, interpret your Decision Health, and use Insights to improve.',
  openGraph: {
    title: 'How to Use Decylo Properly',
    description: 'The complete guide to using Decylo effectively.',
  },
}

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-16">
        {/* Hero */}
        <div className="space-y-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            How to Use Decylo Properly
          </h1>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">
            This is your operating manual. Follow it, and Decylo becomes a real cognitive tool.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Most people use decision tools wrong. This guide prevents that.
          </p>
        </div>

        {/* Core Frame */}
        <section className="space-y-6">
          <Card className="border-[rgba(79,124,255,0.25)] bg-[rgba(79,124,255,0.05)]">
            <CardBody>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[var(--text)]">
                  Decylo is not here to tell you what to choose.
                </h2>
                <p className="text-base text-[var(--text)] font-semibold">
                  It is here to make you impossible to fool — especially by yourself.
                </p>
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-sm font-semibold text-[var(--text-muted)] mb-3">The Decylo Loop:</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-[var(--text)]">
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Think</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Predict</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Choose</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Act</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Observe</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Learn</span>
                    <span className="text-[var(--text-muted)]">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--surface-elevated)]">Repeat</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* How Often to Log Decisions */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">How Often to Log Decisions</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Daily is ideal, but quality matters more</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    One real decision per day is enough. Don't force it. If you're not facing a meaningful choice, skip that day.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold mb-2">What counts as a "real" decision?</h4>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>Something where multiple paths exist</li>
                    <li>Where the outcome actually matters to you</li>
                    <li>Where you're uncertain enough to benefit from structure</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">What doesn't count?</h4>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>Routine choices (what to eat for lunch)</li>
                    <li>Obvious decisions (paying a bill on time)</li>
                    <li>Decisions you've already made (just logging for completeness)</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted-2)] italic">
                    The goal is consistency, not volume. Three thoughtful decisions per week beats seven rushed ones.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* How to Score Honestly */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">How to Score Honestly</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Scoring is where self-deception creeps in. Here's how to stay honest:
                </p>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Outcome Impact (1–10)</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Ask: "If this goes well, how much does it meaningfully improve my life in the next 3–12 months?"
                  </p>
                  <div className="bg-[var(--surface)] rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Examples:</p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
                      <li><strong>1–2:</strong> Switching coffee brands</li>
                      <li><strong>3–4:</strong> Trying a new workout routine</li>
                      <li><strong>5–6:</strong> Taking a course to learn a new skill</li>
                      <li><strong>7–8:</strong> Changing jobs or moving cities</li>
                      <li><strong>9–10:</strong> Getting married, starting a business, major life pivot</li>
                    </ul>
                  </div>
                  <p className="text-xs text-[var(--text-muted-2)] mt-2 italic">
                    Most decisions are 3–6. If everything is 8+, you're inflating.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Cost & Effort (1–10)</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Ask: "What will this option demand from me in time, money, energy, focus, and opportunity cost?"
                  </p>
                  <div className="bg-[var(--surface)] rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Examples:</p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
                      <li><strong>1–2:</strong> Almost no cost (sending an email)</li>
                      <li><strong>3–4:</strong> Minor ongoing cost (subscription service)</li>
                      <li><strong>5–6:</strong> Noticeable commitment (weekly class for 3 months)</li>
                      <li><strong>7–8:</strong> Heavy ongoing burden (side business, major project)</li>
                      <li><strong>9–10:</strong> Consumes major time/money/energy (full career change)</li>
                    </ul>
                  </div>
                  <p className="text-xs text-[var(--text-muted-2)] mt-2 italic">
                    Include emotional effort, not just tasks. Saying "no" to something can be high effort.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Downside Severity (1–10)</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Ask: "If this option turns out badly, how painful are the consequences?"
                  </p>
                  <div className="bg-[var(--surface)] rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)]">Examples:</p>
                    <ul className="text-xs text-[var(--text-muted)] space-y-1 list-disc list-inside">
                      <li><strong>1–2:</strong> Trivial downside (wasted $20)</li>
                      <li><strong>3–4:</strong> Minor setback (lost a week of progress)</li>
                      <li><strong>5–6:</strong> Serious inconvenience (damaged reputation, lost opportunity)</li>
                      <li><strong>7–8:</strong> Major setback (financial loss, relationship damage)</li>
                      <li><strong>9–10:</strong> Long-term damage (career-ending, health impact, legal trouble)</li>
                    </ul>
                  </div>
                  <p className="text-xs text-[var(--text-muted-2)] mt-2 italic">
                    Estimate real damage, not fear. Most decisions have 3–5 downside severity.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* How to Avoid Self-Bias */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">How to Avoid Self-Bias</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Decylo fights bias, but only if you're honest. Here's what to watch for:
                </p>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Common Biases</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Optimism Bias</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        You overestimate positive outcomes. <strong>Fix:</strong> When scoring Impact, ask "What's the realistic best case, not the fantasy?"
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Confirmation Bias</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        You favor options that confirm what you already want. <strong>Fix:</strong> Score all options before looking at recommendations.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Loss Aversion</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        You overestimate downside severity. <strong>Fix:</strong> Ask "What's the worst that actually happens, not what I'm afraid of?"
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Anchoring</h4>
                      <p className="text-xs text-[var(--text-muted)]">
                        Your first score influences the rest. <strong>Fix:</strong> Score all options, then review and adjust.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <h3 className="text-lg font-semibold mb-2">The Honesty Test</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Before submitting, ask yourself:
                  </p>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>Would I score this the same way if I showed it to someone I respect?</li>
                    <li>Am I inflating Impact because I want this option to win?</li>
                    <li>Am I deflating Cost because I don't want to admit the effort?</li>
                    <li>Is my Downside Severity based on fear or reality?</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* What Decision Health Means */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">What Decision Health Actually Means</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">What Decision Quality Means</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">
                    Decision Quality measures how accurately you predict the real consequences of your choices — and how often you follow through.
                  </p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    It's not about making "good" decisions. It's about being accurate about your predictions and closing the loop.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">What a High Score (80+) Means</h4>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>You're well-calibrated: when you're 70% confident, you're right ~70% of the time</li>
                    <li>You have good judgment in the areas you track</li>
                    <li>You're learning from outcomes and adjusting</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">What a Low Score (&lt;50) Means</h4>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>You're overconfident: you think you know more than you do</li>
                    <li>You're not learning from past outcomes</li>
                    <li>You might be scoring dishonestly (see "How to Score Honestly" above)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">What a Medium Score (50–80) Means</h4>
                  <ul className="text-sm text-[var(--text-muted)] space-y-2 list-disc list-inside">
                    <li>You're improving but have room to grow</li>
                    <li>You might be inconsistent across categories</li>
                    <li>You're on the right track — keep logging outcomes</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted-2)] italic">
                    Decision Health improves slowly. Don't expect changes week-to-week. Look for trends over months.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Good Week vs Bad Week */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">What a Good Week vs Bad Week Looks Like</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Good Week" />
              <CardBody>
                <div className="space-y-3 text-sm text-[var(--text-muted)]">
                  <div>
                    <h4 className="font-semibold mb-1">3–5 decisions logged</h4>
                    <p className="text-xs">Quality over quantity. Each decision was real and meaningful.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">All outcomes logged</h4>
                    <p className="text-xs">You closed every loop. No "Outcome due" cards lingering.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Honest scoring</h4>
                    <p className="text-xs">Your scores reflect reality, not what you want to be true.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Learning captured</h4>
                    <p className="text-xs">You wrote down what you learned from each outcome.</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Bad Week" />
              <CardBody>
                <div className="space-y-3 text-sm text-[var(--text-muted)]">
                  <div>
                    <h4 className="font-semibold mb-1">0–1 decisions logged</h4>
                    <p className="text-xs">You're not using the tool, or logging trivial choices.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Outcomes not logged</h4>
                    <p className="text-xs">Decisions pile up as "Outcome due." The loop isn't closing.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Inflated scores</h4>
                    <p className="text-xs">Everything is 8+ Impact. You're not being honest with yourself.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">No learning</h4>
                    <p className="text-xs">You log outcomes but skip the "What did you learn?" field.</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* How to Use Insights */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use Insights to Change Future Behavior</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Insights aren't just data. They're feedback loops. Here's how to use them:
                </p>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Decision Health Trend</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    If it's going up: you're improving. Keep doing what you're doing.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    If it's flat or going down: check Category Intelligence. Which areas are dragging you down?
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Calibration Gap</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    This shows how far off your confidence predictions are.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    <strong>If high:</strong> You're overconfident. Start scoring more conservatively. Ask "What could go wrong?" more often.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    <strong>If low:</strong> You're well-calibrated. Trust your judgment in this area.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Category Intelligence</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    Shows which life domains you're strongest and weakest in.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    <strong>Use it:</strong> When facing a decision in a weak category, be extra careful. Score more conservatively. Get input from others.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Pattern Warnings</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    Decylo will surface patterns like "Your last 5 high-confidence decisions in Health ended worse than expected."
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    <strong>Don't ignore these.</strong> They're your blind spots. Slow down. Question your assumptions.
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border)]">
                  <h3 className="text-lg font-semibold mb-2">The Weekly Review</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    Every Sunday, spend 5 minutes:
                  </p>
                  <ol className="text-sm text-[var(--text-muted)] space-y-1 list-decimal list-inside">
                    <li>Check your Decision Health trend</li>
                    <li>Review Category Intelligence — which area needs work?</li>
                    <li>Read your pattern warnings</li>
                    <li>Ask: "What will I do differently next week based on this?"</li>
                  </ol>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="text-center space-y-6 pt-8 border-t border-[var(--border)]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Ready to Use Decylo Properly?</h2>
            <p className="text-sm text-[var(--text-muted)]">
              This guide is your foundation. Now go make better decisions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="secondary">Learn How It Works</Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

