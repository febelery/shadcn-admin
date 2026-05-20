import { useShallow } from 'zustand/react/shallow'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useBuilderStore } from '../../store'

import { cn } from '@/lib/utils'
import {
  builderTypeCaption,
  builderTypeLabel,
  builderTypeMono,
  builderTypeBody,
} from '../../ui'


export function SurveyPublishInfoCard() {
  const publishInfo = useBuilderStore(
    useShallow((s) =>
      s.schema?.slug
        ? { slug: s.schema.slug, version: s.schema.version }
        : null
    )
  )

  if (!publishInfo) return null

  return (
    <Card className='gap-0 py-0 shadow-sm'>
      <CardHeader className='px-4 py-3'>
        <CardTitle className={builderTypeLabel}>发布信息</CardTitle>
      </CardHeader>
      <CardContent className={cn('flex flex-col gap-2 px-4 pt-0 pb-4', builderTypeBody)}>
        <div className='flex items-center justify-between gap-2'>
          <span className={builderTypeCaption}>标识</span>
          <code className={cn(builderTypeMono, 'bg-muted rounded px-1.5 py-0.5')}>
            {publishInfo.slug}
          </code>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className={builderTypeCaption}>版本</span>
          <code className={cn(builderTypeMono, 'bg-muted rounded px-1.5 py-0.5')}>
            v{publishInfo.version}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}
