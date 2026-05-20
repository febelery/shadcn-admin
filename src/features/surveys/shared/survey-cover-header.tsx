import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { SurveyMeta, ThemeConfig } from '../core/types'

type Props = {
  meta: SurveyMeta
  theme: ThemeConfig
  className?: string
  /** 构建器画布：自定义标题/说明槽，实现 WYSIWYG */
  titleSlot?: ReactNode
  descriptionSlot?: ReactNode
}

/** 纯色 / 图片头图统一高度 */
const COVER_HEIGHT = 'h-60'

function hasDescriptionHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length > 0
}

/** 问卷说明（富文本 HTML） */
function SurveyDescription({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  if (!hasDescriptionHtml(html)) return null
  return (
    <div
      className={cn(
        'prose prose-sm mt-1.5 max-w-none text-sm leading-relaxed',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** 图片头图底部文字区：全宽渐变融入头图，避免悬浮卡片割裂感 */
function CoverImageTextZone({
  children,
  hasImage,
}: {
  children: ReactNode
  hasImage: boolean
}) {
  return (
    <>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-[72%]',
          hasImage
            ? 'bg-linear-to-t from-black/75 via-black/35 to-transparent'
            : 'from-muted via-muted/55 bg-linear-to-t to-transparent'
        )}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-10 w-full px-5 pt-16 pb-5',
          hasImage && '[text-shadow:0_1px_2px_rgb(0_0_0/0.45)]'
        )}
      >
        {children}
      </div>
    </>
  )
}

/** 问卷头图区域（设计器画布 / 预览共用） */
export function SurveyCoverHeader({
  meta,
  theme,
  className,
  titleSlot,
  descriptionSlot,
}: Props) {
  const titleEl = titleSlot ?? (
    <h1 className='text-lg leading-snug font-semibold'>{meta.title}</h1>
  )

  const descriptionEl =
    descriptionSlot ??
    (hasDescriptionHtml(meta.description) ? (
      <SurveyDescription
        html={meta.description}
        className='text-muted-foreground'
      />
    ) : null)

  if (meta.coverType === 'none') {
    return (
      <div className={cn('px-4 pt-4 pb-2', className)}>
        {titleEl}
        {descriptionEl}
      </div>
    )
  }

  if (meta.coverType === 'image') {
    const hasImage = Boolean(meta.cover)

    return (
      <div className={cn('relative overflow-hidden', COVER_HEIGHT, className)}>
        {hasImage ? (
          <img
            src={meta.cover}
            alt=''
            className='absolute inset-0 size-full object-cover'
          />
        ) : (
          <div className='bg-muted absolute inset-0' />
        )}

        {!hasImage && (
          <p className='text-muted-foreground pointer-events-none absolute inset-x-0 top-6 text-center text-xs'>
            上传头图后在此预览
          </p>
        )}

        <CoverImageTextZone hasImage={hasImage}>
          {titleEl}
          {descriptionSlot ? (
            descriptionEl
          ) : (
            <SurveyDescription
              html={meta.description}
              className={cn(
                hasImage
                  ? 'prose-invert text-white/90'
                  : 'text-muted-foreground'
              )}
            />
          )}
        </CoverImageTextZone>
      </div>
    )
  }

  return (
    <div
      className={cn(
        COVER_HEIGHT,
        'flex flex-col justify-end px-6 py-8 text-white',
        className
      )}
      style={{
        backgroundColor: meta.coverColor || theme.primaryColor,
      }}
    >
      {titleEl}
      {descriptionSlot ? (
        descriptionEl
      ) : (
        <SurveyDescription
          html={meta.description}
          className='prose-invert opacity-90'
        />
      )}
    </div>
  )
}
