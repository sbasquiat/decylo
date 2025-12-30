'use client'

interface SuccessToastProps {
  isOpen: boolean
  onClose: () => void
  title: string
}

export default function SuccessToast({ isOpen, onClose, title }: SuccessToastProps) {
  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <div className="rounded-2xl border border-[rgba(59,214,113,0.25)] bg-[rgba(59,214,113,0.12)] p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <button
            onClick={onClose}
            className="ml-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}


