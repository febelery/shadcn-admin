import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useBuilderStructure } from '../../context'

export function PublishInfoCard() {
  const { schema } = useBuilderStructure()

  if (!schema?.slug) return null

  return (
    <Card className='gap-0 py-0 shadow-sm'>
      <CardHeader className='px-4 py-3'>
        <CardTitle className='text-muted-foreground text-xs font-medium'>
          发布信息
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-col gap-2 px-4 pt-0 pb-4',
          'text-sm leading-relaxed'
        )}
      >
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs leading-relaxed'>
            标识
          </span>
          <code
            className={cn(
              'text-muted-foreground font-mono text-xs leading-none tabular-nums',
              'bg-muted rounded px-1.5 py-0.5'
            )}
          >
            {schema.slug}
          </code>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs leading-relaxed'>
            版本
          </span>
          <code
            className={cn(
              'text-muted-foreground font-mono text-xs leading-none tabular-nums',
              'bg-muted rounded px-1.5 py-0.5'
            )}
          >
            v{schema.version}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
