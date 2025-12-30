import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Decylo',
  description: 'Get in touch with the Decylo team.',
}

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Contact
        </h1>
        <p className="text-lg text-[var(--text-muted)] mb-8">
          Have a question or feedback? We'd love to hear from you.
        </p>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Email</h2>
            <p className="text-[var(--text-muted)]">
              <a
                href="mailto:robotic.82.ducat@icloud.com"
                className="text-[var(--accent)] hover:opacity-90"
              >
                robotic.82.ducat@icloud.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


