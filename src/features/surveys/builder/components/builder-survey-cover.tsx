import { cn } from '@/lib/utils'
import type { SurveyMeta, ThemeConfig } from '../../core/types'
import { SurveyCoverHeader } from '../../shared/survey-cover-header'
import { LABEL_LIMITS } from '../label-limits'
import { builderTypeBody, builderTypeDisplay } from '../ui'
import { InlineEditable } from '../question-surface/inline-editable'
import { useBuilderStore } from '../store'

type Props = {
  meta: SurveyMeta
  theme: ThemeConfig
}

export function BuilderSurveyCover({ meta, theme }: Props) {
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  const hasCoverImage = Boolean(meta.cover)
  const onLightText =
    meta.coverType === 'color' || (meta.coverType === 'image' && hasCoverImage)

  const titleClass = cn(
    builderTypeDisplay,
    onLightText ? 'text-white' : 'text-foreground'
  )

  const descriptionClass = cn(
    builderTypeBody,
    'mt-2 min-h-[1.25em]',
    onLightText ? 'text-white/90' : 'text-muted-foreground'
  )

  return (
    <SurveyCoverHeader
      meta={meta}
      theme={theme}
      titleSlot={
        <InlineEditable
          value={meta.title}
          onChange={(title) => updateMeta({ title })}
          placeholder='未命名问卷'
          maxLength={LABEL_LIMITS.surveyTitle}
          className={cn(titleClass, 'max-w-full min-w-0 wrap-break-word')}
        />
      }
      descriptionSlot={
        <InlineEditable
          value={meta.description}
          onChange={(description) => updateMeta({ description })}
          placeholder='添加问卷说明（选填）'
          multiline
          maxLength={LABEL_LIMITS.surveyDescription}
          className={cn(descriptionClass, 'max-w-full min-w-0')}
        />
      }
    />
  )
}
