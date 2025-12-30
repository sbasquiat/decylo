import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export const metadata: Metadata = {
  title: 'How Decylo Works',
  description: 'Learn how Decylo helps you make better decisions by closing the loop between what you choose and what actually happens.',
  openGraph: {
    title: 'How Decylo Works',
    description: 'Learn how Decylo helps you make better decisions by closing the loop.',
  },
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-16">
        {/* Hero */}
        <div className="space-y-6 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            How Decylo Works
          </h1>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">
            Decylo helps you make better decisions by closing the loop between what you choose and what actually happens.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Most people decide. Very few people learn from their decisions.
            <br />
            Decylo makes learning automatic.
          </p>
        </div>

        {/* The Decylo Loop */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">The Decylo Loop</h2>
          <p className="text-sm text-[var(--text-muted)] italic">
            This is how judgment improves: one closed loop at a time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Capture */}
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(79,124,255,0.12)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center text-xl">
                      ✍️
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">1. Capture</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Write down a real decision you're facing.
                    <br />
                    <span className="text-xs italic">Small or big — what matters is that it's real.</span>
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Step 2: Decide */}
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(79,124,255,0.12)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center text-xl">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">2. Decide</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Choose your path and record your confidence at the moment of decision.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Step 3: Act */}
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(79,124,255,0.12)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center text-xl">
                      🚀
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">3. Act</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Live your life. Execute the decision.
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Step 4: Reflect */}
            <Card>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(79,124,255,0.12)] border border-[rgba(79,124,255,0.25)] flex items-center justify-center text-xl">
                      🧠
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">4. Reflect</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Log what actually happened and what you learned.
                    <br />
                    <span className="text-xs italic">This closes the loop and trains your judgment.</span>
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* How to Use Decylo Daily */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">How to Use Decylo Daily</h2>
          
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-3">Every day</h3>
                  <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Add the most important decision you're facing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Decide.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>Come back and log the outcome.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-sm font-semibold mb-2">In 30 seconds a day, you build:</p>
                  <ul className="space-y-1 text-sm text-[var(--text-muted)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>clarity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>consistency</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-0.5">•</span>
                      <span>better judgment</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* What Decylo Tracks For You */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">What Decylo Tracks For You</h2>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Decylo measures things you normally never see:
          </p>
          
          <Card>
            <CardBody>
              <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--primary)] mt-0.5">•</span>
                  <span>Your decision streak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--primary)] mt-0.5">•</span>
                  <span>Your outcome quality over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--primary)] mt-0.5">•</span>
                  <span>Your confidence vs reality calibration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--primary)] mt-0.5">•</span>
                  <span>Patterns in your judgment</span>
                </li>
              </ul>
              <p className="text-sm font-semibold mt-4 pt-4 border-t border-[var(--border)]">
                These become your Decision Health.
              </p>
            </CardBody>
          </Card>
        </section>

        {/* What Makes a Good Decision */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">What Makes a Good Decision</h2>
          <Card>
            <CardBody>
              <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                <p className="text-[var(--text)] font-semibold text-base">
                  A good decision is not one that feels good —<br />
                  it is one that maximizes long-term value under uncertainty.
                </p>
                <p>
                  Decylo helps you make decisions based on impact, effort, and risk — not just emotion.
                  By tracking outcomes over time, you learn what actually works, not what feels right in the moment.
                </p>
                <p className="text-[var(--text)] font-medium pt-2 border-t border-[var(--border)]">
                  Decision Quality measures how accurately you predict the real consequences of your choices — and how often you follow through.
                </p>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Why This Works */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Why This Works</h2>
          <Card>
            <CardBody>
              <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed">
                <p>
                  People don't improve by making more decisions.
                </p>
                <p className="text-[var(--text)] font-medium">
                  They improve by learning from their decisions.
                </p>
                <p>
                  Decylo gives you a private system for doing exactly that.
                </p>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Getting Started */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
          <Card>
            <CardBody>
              <div className="space-y-4">
                <ol className="space-y-3 text-sm text-[var(--text-muted)]">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--primary)] font-semibold">1.</span>
                    <span>Add your first decision.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--primary)] font-semibold">2.</span>
                    <span>Decide and record your confidence.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--primary)] font-semibold">3.</span>
                    <span>Come back tomorrow and log what happened.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--primary)] font-semibold">4.</span>
                    <span>Watch your Decision Health evolve.</span>
                  </li>
                </ol>
                
                <div className="pt-4 border-t border-[var(--border)]">
                  <Link href="/signup">
                    <Button className="w-full sm:w-auto">
                      Start your first decision
                    </Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  )
}

