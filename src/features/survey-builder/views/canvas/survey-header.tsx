import { cn } from '@/lib/utils'
import { useSchemaStore, useUIStore } from '@/features/survey-builder/state'

export function SurveyHeader() {
  const updateMeta = useSchemaStore((s) => s.updateMeta)
  const fontColor = useSchemaStore((s) => s.meta.fontColor)
  const coverType = useSchemaStore((s) => s.meta.coverType)
  const coverColor = useSchemaStore((s) => s.meta.coverColor)
  const cover = useSchemaStore((s) => s.meta.cover)
  const title = useSchemaStore((s) => s.meta.title)
  const description = useSchemaStore((s) => s.meta.description)

  const { selectNode } = useUIStore()

  const fontStyle = fontColor ? { color: fontColor } : {}
  const subFontStyle = fontColor ? { color: fontColor, opacity: 0.5 } : {}
  const badgeFontStyle = fontColor ? { color: fontColor, opacity: 0.35 } : {}

  return (
    <div
      className={cn(
        'group border-border/10 bg-background relative w-full cursor-pointer overflow-hidden rounded-t-lg border-b transition-all',
        'hover:bg-muted/30 focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none'
      )}
      style={{
        background: coverType === 'color' ? coverColor : 'var(--background)',
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (
          target === e.currentTarget ||
          target.hasAttribute('data-canvas-bg')
        ) {
          selectNode(null)
        }
      }}
      data-canvas-bg
    >
      {/* Cover image */}
      {coverType === 'image' && cover && (
        <>
          <div
            className='absolute inset-0 bg-cover bg-center transition-transform duration-500'
            style={{ backgroundImage: `url(${cover})` }}
          />
          <div className='absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50' />
        </>
      )}

      <div data-canvas-bg className='relative z-10 px-8 py-10 sm:px-12'>
        <input
          className='placeholder:text-foreground/40 mb-2 w-full bg-transparent text-2xl font-bold transition-colors outline-none sm:text-3xl'
          style={fontStyle}
          value={title}
          placeholder='未命名问卷'
          onChange={(e) => updateMeta({ title: e.target.value })}
        />
        <textarea
          rows={2}
          className='placeholder:text-foreground/30 field-sizing-content w-full resize-none bg-transparent text-sm leading-relaxed transition-colors outline-none sm:text-base'
          style={subFontStyle}
          value={description}
          placeholder='添加问卷描述说明...'
          onChange={(e) => updateMeta({ description: e.target.value })}
        />

        {/* Hover Edit Hint */}
        <div className='absolute top-6 right-6 opacity-0 transition-opacity group-hover:opacity-100'>
          <span
            className='bg-muted/60 text-foreground/70 rounded-md px-2 py-1 text-[10px] font-medium tracking-wide backdrop-blur-sm'
            style={badgeFontStyle}
          >
            编辑设置
          </span>
        </div>
      </div>
    </div>
  )
}
