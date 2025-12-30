import { getStatusBadgeText } from '@/lib/decision-status'

interface StatusBadgeProps {
  status: 'open' | 'decided' | 'completed' | 'Open' | 'Decided' | 'Completed'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusLower = status.toLowerCase() as 'open' | 'decided' | 'completed'
  
  const styles = {
    open: 'bg-white/5 text-[var(--text-muted)] border-[var(--border)]',
    decided: 'bg-[rgba(79,124,255,0.12)] text-white border-[rgba(79,124,255,0.25)]',
    completed: 'bg-[rgba(59,214,113,0.12)] text-white border-[rgba(59,214,113,0.25)]',
  }

  const label = getStatusBadgeText(statusLower)

  return (
    <span className={`rounded-xl border px-3 py-1 text-xs font-semibold ${styles[statusLower]}`}>
      {label}
    </span>
  )
}

