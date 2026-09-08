import * as React from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import type { Application } from '@splinetool/runtime'

interface SplineSceneProps {
  scene: string
  className?: string
  style?: React.CSSProperties
  onLoad?: (app: Application) => void
}

export function SplineScene({
  scene,
  className,
  style,
  onLoad,
}: SplineSceneProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let app: Application | null = null
    let isMounted = true

    setIsLoading(true)

    import('@splinetool/runtime')
      .then(({ Application }) => {
        if (!isMounted || !canvasRef.current) return
        app = new Application(canvasRef.current, {
          renderer: 'webgl',
        })
        return app.load(scene)
      })
      .then(() => {
        if (isMounted) {
          setIsLoading(false)
          if (app) {
            onLoad?.(app)
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load Spline scene:', err)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
      if (app) {
        try {
          app.dispose()
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [scene, onLoad])

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={style}
    >
      {isLoading && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-transparent'>
          <Spinner className='size-8 text-muted-foreground' />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className='h-full w-full'
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.4s ease',
        }}
      />
    </div>
  )
}

