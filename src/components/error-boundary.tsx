import React from 'react'
import { RotateCcw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error
  onReset?: () => void
}) {
  return (
    <Empty className='justify-start'>
      <EmptyHeader>
        <EmptyMedia
          variant='icon'
          className='bg-destructive/10 text-destructive'
        >
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle>出错了</EmptyTitle>
        <EmptyDescription>
          <code className='font-mono text-xs'>{error.message}</code>
        </EmptyDescription>
      </EmptyHeader>
      {onReset && (
        <EmptyContent>
          <Button size='sm' variant='outline' onClick={onReset}>
            <RotateCcw className='size-3' />
            重试
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?:
    | React.ReactNode
    | ((error: Error, reset: () => void) => React.ReactNode)
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { fallback, children } = this.props

    if (error) {
      const fb =
        fallback ??
        ((e: Error) => <ErrorFallback error={e} onReset={this.reset} />)
      return typeof fb === 'function' ? fb(error, this.reset) : fb
    }

    return children
  }
}
