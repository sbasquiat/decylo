import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Decylo',
  description: 'Terms of Service for Decylo.',
}

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-muted)]">
          <p className="text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Decylo, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">2. Use License</h2>
              <p>
                Permission is granted to temporarily use Decylo for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">3. User Account</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">4. Subscription and Payment</h2>
              <p>
                If you subscribe to Decylo Pro, you agree to pay the subscription fees as described on our pricing page. Subscriptions are billed in advance and are non-refundable.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">5. Limitation of Liability</h2>
              <p>
                In no event shall Decylo or its suppliers be liable for any damages arising out of the use or inability to use Decylo.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


