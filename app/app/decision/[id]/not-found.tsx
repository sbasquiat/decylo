import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h1 className="text-xl font-semibold mb-2">Decision not found</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          This decision doesn't exist or you don't have permission to view it.
        </p>
        <Link
          href="/app/timeline"
          className="text-sm font-semibold text-[var(--primary)] hover:opacity-90"
        >
          ← Back to Timeline
        </Link>
      </div>
    </div>
  )
}


