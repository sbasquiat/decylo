'use client'

import { Component, ReactNode } from 'react'
import Link from 'next/link'
import { Card } from './ui/Card'
import { PrimaryButton, SecondaryButton } from './ui/Button'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('App Error Boundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="space-y-4 text-center">
              <div>
                <h1 className="text-xl font-semibold tracking-tight mb-2">
                  Something went wrong
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">
                    Error details (dev only):
                  </p>
                  <p className="text-xs text-[var(--text-muted-2)] font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <PrimaryButton onClick={this.handleReset} className="w-full">
                  Try again
                </PrimaryButton>
                <Link href="/app" className="block">
                  <SecondaryButton className="w-full">
                    Back to Today
                  </SecondaryButton>
                </Link>
              </div>

              <p className="text-xs text-[var(--text-muted-2)] pt-2">
                If this problem persists, please{' '}
                <a
                  href="mailto:robotic.82.ducat@icloud.com"
                  className="text-[var(--accent)] hover:opacity-90 underline"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

