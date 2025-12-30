import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — Decylo',
  description: 'Frequently asked questions about Decylo, the decision-making workspace that helps you think clearly and act intentionally.',
  openGraph: {
    title: 'FAQ — Decylo',
    description: 'Frequently asked questions about Decylo, the decision-making workspace.',
  },
}

export default function FAQPage() {
  const faqs = [
    {
      q: 'What is Decylo?',
      a: 'Decylo is a decision-making workspace. Capture decisions, compare options, commit with confidence, and learn from outcomes.',
    },
    {
      q: 'Is Decylo a to-do list?',
      a: 'No. Decylo is built for decisions. It helps you think clearly first, then act.',
    },
    {
      q: 'How does scoring work?',
      a: 'You score options by impact, effort, and risk. Decylo suggests a choice based on your inputs, but you stay in control.',
    },
    {
      q: 'What kinds of decisions can I use it for?',
      a: 'Work, money, health, career, relationships — anything where you want clarity and follow-through.',
    },
    {
      q: "What's included in Free vs Pro?",
      a: 'Free gives you the core flow with limited history. Pro unlocks unlimited history, deeper insights, templates, and exports.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Cancel anytime, no questions.',
    },
    {
      q: 'Do you sell user data?',
      a: 'No. No ads. No data selling.',
    },
    {
      q: 'Is there a Teams plan?',
      a: 'Teams is coming soon. Join the waitlist on the Pricing page.',
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">FAQ</h1>
        </div>

        <div className="space-y-8">
          {faqs.map((faq, idx) => (
            <div key={idx} className="space-y-3">
              <h2 className="text-lg font-semibold">{faq.q}</h2>
              <p className="text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

