import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Decylo',
  description: 'Privacy Policy for Decylo.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-invert max-w-none space-y-6 text-[var(--text-muted)]">
          <p className="text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">1. Information We Collect</h2>
              <p>
                We collect information that you provide directly to us, including your email address, display name, and decision data when you use Decylo.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve Decylo, process transactions, and communicate with you.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">3. Data Storage and Security</h2>
              <p>
                Your data is stored securely using Supabase. We implement appropriate technical and organizational measures to protect your personal information.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">4. Data Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share information only as necessary to provide our services or as required by law.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">5. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-[var(--text)] mb-2">6. Cookies</h2>
              <p>
                We use cookies to maintain your session and improve your experience. You can control cookies through your browser settings.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}


