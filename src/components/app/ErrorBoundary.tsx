import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI boundary captured an error', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-card">
          <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-destructive/12 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-secondary-foreground">
            The current view could not be rendered.
          </p>
          <Button type="button" className="mt-5" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    )
  }
}
