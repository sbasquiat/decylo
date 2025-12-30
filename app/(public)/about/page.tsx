import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Decylo',
  description: 'Learn about Decylo, the decision-making workspace created to help people think clearly and make better decisions every day.',
  openGraph: {
    title: 'About Decylo',
    description: 'Learn about Decylo and our mission to help people make better decisions.',
  },
}

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-16">
          {/* Header */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">About Decylo</h1>
            <div className="space-y-4 text-[var(--text-muted)] leading-relaxed">
              <p>
                Decylo was created to solve a quiet problem that affects everyone:
              </p>
              <p className="text-[var(--text)] font-medium">
                Most people are working hard — but not thinking clearly.
              </p>
              <p>
                Every day, we make decisions that shape our careers, health, finances,
                relationships, and future. Yet almost no one is taught how to think through them
                properly, track outcomes, or learn from the results.
              </p>
              <p className="text-[var(--text)] font-medium">Decylo exists to change that.</p>
            </div>
          </div>

          {/* Our Philosophy */}
          <div className="space-y-6 border-t border-[var(--border)] pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">Our Philosophy</h2>
            <div className="space-y-4 text-[var(--text-muted)] leading-relaxed">
              <p>
                Decylo is not a task manager. It's not another productivity app.
              </p>
              <p>
                It's a personal operating system for clarity, judgment, and growth.
              </p>
              <p>
                A calm space where your thinking becomes visible, your choices become intentional,
                and your progress becomes measurable.
              </p>
            </div>
          </div>

          {/* What We Believe */}
          <div className="space-y-6 border-t border-[var(--border)] pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">What We Believe</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-[var(--accent)] mt-1">•</span>
                <p className="text-[var(--text-muted)]">Clarity is power</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--accent)] mt-1">•</span>
                <p className="text-[var(--text-muted)]">Reflection is a skill</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--accent)] mt-1">•</span>
                <p className="text-[var(--text-muted)]">Growth is built through better choices</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[var(--accent)] mt-1">•</span>
                <p className="text-[var(--text-muted)]">
                  Your future is shaped by the decisions you make today
                </p>
              </div>
            </div>
          </div>


          {/* The Mission */}
          <div className="space-y-6 border-t border-[var(--border)] pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">The Mission</h2>
            <p className="text-lg text-[var(--text)] font-medium leading-relaxed">
              To help people make better decisions — every day.
            </p>
          </div>
        </div>
    </div>
  )
}

