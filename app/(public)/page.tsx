import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-[var(--text)] tracking-tight">
            Decylo
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-[var(--text)] tracking-tight">
            Make better decisions. Every day.
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[var(--text-muted)] leading-relaxed">
            Your life is shaped by the decisions you make. Decylo gives you a system to think clearly, choose confidently, and learn from every outcome.
          </p>
          <p className="max-w-2xl mx-auto text-base font-semibold text-[var(--text)] leading-relaxed pt-2">
            Decylo doesn't help you do more.<br />
            It helps you become harder to fool — including by yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button>Get Started Free</Button>
            </Link>
            <Link href="/signin">
              <Button variant="secondary">Sign In</Button>
            </Link>
          </div>
          <p className="text-sm text-[var(--text-muted)] pt-2">
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      {/* Why Decylo Exists */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Why Decylo Exists</h2>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Most people are busy — but not improving their decision-making.
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Your life is shaped by decisions — most of them made under pressure.
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Every day, you make hundreds of decisions. Most of them happen in your head, without
              structure, reflection, or learning.
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              That's why progress feels chaotic — even when you're working hard.
            </p>
            <p className="text-[var(--text)] font-medium leading-relaxed">
              Decylo is your daily decision tracker and personal operating system for thinking
              clearly.
            </p>
          </div>
        </div>
      </section>

      {/* How Decylo Works */}
      <section id="product" className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-12">How Decylo Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Capture</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Write down the decision you're facing.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Evaluate</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Compare options, trade-offs, effort, and risk.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Commit</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Choose intentionally and define your next action.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Reflect</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Track outcomes and build better judgment over time.
              </p>
            </div>
          </div>
          <p className="mt-8 text-center text-[var(--text-muted)] leading-relaxed">
            This loop is what builds better judgment over time.
          </p>
          <p className="mt-4 text-center text-[var(--text)] font-medium">
            Decylo turns reflection into real progress.
          </p>
        </div>
      </section>

      {/* What Makes Decylo Different */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">What Makes Decylo Different</h2>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            Decylo closes the decision loop: Think → Choose → Act → Review → Improve.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Built for daily use</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">No clutter. No noise.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Focused on decisions, not tasks</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Helps you improve your decision-making skills
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Designed to reduce mental overload and increase clarity
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Works for life, work, business, money, health, and growth
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Decylo Is For */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Who Decylo Is For</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Decylo is built for:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Professionals & founders</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Creators & entrepreneurs</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Students & lifelong learners</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Anyone who wants to think clearly, act intentionally, and grow faster
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Benefits of Using Decylo</h2>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            One good decision can change your month. Decylo helps you make them consistently.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Make better life and business decisions
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Reduce stress and decision fatigue</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Build confidence in your choices</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">Learn from past outcomes</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Create momentum through consistent progress
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[var(--accent)] mt-1">•</span>
              <p className="text-sm text-[var(--text-muted)]">
                Develop stronger judgment over time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Decylo Experience */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">The Decylo Experience</h2>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Decylo becomes your daily thinking space: a calm, modern workspace where clarity
              replaces chaos and progress becomes measurable.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Start building better decisions today
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Your future is shaped by the decisions you make next.
            </p>
            <div className="pt-4">
              <Link href="/signup">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

              {/* SEO Footer - Hidden, kept for SEO purposes */}
              <div className="sr-only">
                <p className="text-xs text-[var(--text-muted-2)]">
                  Decylo is a decision making app, productivity app, personal operating system, daily
                  decision tracker, decision journal, thinking tool, reflection app, self-improvement
                  platform, and life planning software designed to help you make better decisions and
                  improve your life and work.
                </p>
              </div>
            </>
          )
        }
