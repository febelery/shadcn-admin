import { cn } from '@/lib/utils'

interface BlobBackgroundProps {
  className?: string
  children?: React.ReactNode
}

/**
 * 背景渐变，并添加了动画效果
 * @param param0
 * @returns
 */
export function BackgroundBlob({ className, children }: BlobBackgroundProps) {
  return (
    <div
      className={cn(
        'from-background to-secondary/20 relative flex w-full items-center justify-center overflow-hidden bg-linear-to-br',
        'h-screen',
        className
      )}
    >
      <div className='pointer-events-none absolute inset-0 h-full w-full'>
        <div className='animate-blob absolute top-0 -left-4 h-72 w-72 rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter' />
        <div className='animate-blob animation-delay-2000 absolute top-0 -right-4 h-72 w-72 rounded-full bg-yellow-300 opacity-70 mix-blend-multiply blur-xl filter' />
        <div className='animate-blob animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-pink-300 opacity-70 mix-blend-multiply blur-xl filter' />
      </div>
      {children}
    </div>
  )
}
