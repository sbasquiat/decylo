import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseClasses = 'h-11 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  const variantClasses = {
    primary: 'bg-[var(--primary)] text-white shadow-[0_0_0_4px_rgba(79,124,255,0.12)] hover:shadow-[0_0_0_6px_rgba(79,124,255,0.14)]',
    secondary: 'border border-[var(--border)] bg-transparent text-[var(--text)] hover:bg-white/5',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Convenience exports
export function PrimaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="primary" className={className} {...props}>{children}</Button>
}

export function SecondaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="secondary" className={className} {...props}>{children}</Button>
}

