import AuthNavbar from '@/components/AuthNavbar'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      <AuthNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}


