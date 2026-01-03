import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { PrimaryButton } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="space-y-4 text-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              404
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Page not found
            </p>
          </div>

          <p className="text-sm text-[var(--text-muted-2)]">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <Link href="/app" className="block">
              <PrimaryButton className="w-full">
                Go to Today
              </PrimaryButton>
            </Link>
            <Link href="/app/new" className="block">
              <PrimaryButton variant="secondary" className="w-full">
                New Decision
              </PrimaryButton>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

