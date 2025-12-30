import { InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function TextInput({ label, className = '', ...props }: TextInputProps) {
  const input = (
    <input
      className={`h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(79,124,255,0.14)] transition ${className}`}
      {...props}
    />
  )

  if (label) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[var(--text-muted)]">
          {label}
        </label>
        {input}
      </div>
    )
  }

  return input
}

