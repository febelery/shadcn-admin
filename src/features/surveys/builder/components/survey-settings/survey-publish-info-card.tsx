import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBuilderStore } from '../../store'

export function SurveyPublishInfoCard() {
  const schema = useBuilderStore((s) => s.schema)

  if (!schema?.slug) return null

  return (
    <Card className='gap-0 py-0 shadow-sm'>
      <CardHeader className='px-4 py-3'>
        <CardTitle className='text-xs font-medium'>发布信息</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2 px-4 pt-0 pb-4 text-sm'>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs'>标识</span>
          <code className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs'>
            {schema.slug}
          </code>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className='text-muted-foreground text-xs'>版本</span>
          <code className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs'>
            v{schema.version}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
