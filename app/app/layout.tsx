import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNavbar from '@/components/AppNavbar'
import InsightFeedbackToast from '@/components/InsightFeedbackToast'
import AppErrorBoundary from '@/components/AppErrorBoundary'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <AppErrorBoundary>
      <div className="min-h-screen bg-[var(--bg)]">
        <AppNavbar />
        <main>{children}</main>
        <InsightFeedbackToast />
      </div>
    </AppErrorBoundary>
  )
}

