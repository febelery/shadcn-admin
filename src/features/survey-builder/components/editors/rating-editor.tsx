'use client'
import { Circle, Heart, Star, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/features/survey-builder/store'
import type { QuestionNode } from '@/features/survey-builder/types'

export function InlineRatingEditor({ node }: { node: QuestionNode }) {
  const { updateNodeConfig } = useBuilderStore()
  const count = node.config.starCount ?? 5
  const shape = node.config.starShape ?? 'star'

  const handleUpdateCount = (newCount: number) => {
    updateNodeConfig(node.id, {
      starCount: Math.max(1, Math.min(10, newCount)),
    })
  }

  const renderIcon = (shape: string) => {
    const IconProps = { className: 'size-4' }
    switch (shape) {
      case 'heart':
        return <Heart {...IconProps} />
      case 'thumb':
        return <ThumbsUp {...IconProps} />
      case 'circle':
        return <Circle {...IconProps} />
      case 'star':
      default:
        return <Star {...IconProps} />
    }
  }

  return (
    <div
      className='flex flex-col gap-2 p-2'
      onClick={(e) => e.stopPropagation()}
    >
      <div className='flex items-center gap-1.5'>
        {Array.from({ length: 10 }).map((_, i) => (
          <button
            key={i}
            onClick={() => handleUpdateCount(i + 1)}
            className={cn(
              'flex size-6 items-center justify-center transition-all hover:scale-110',
              i < count ? 'text-foreground' : 'text-muted-foreground/15'
            )}
          >
            {renderIcon(shape)}
          </button>
        ))}
      </div>
    </div>
  )
}
