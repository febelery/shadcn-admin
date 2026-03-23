import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/features/survey-builder/store'

export function SurveyHeader() {
  const { meta, updateMeta, selectNode } = useBuilderStore()
  const fontStyle = meta.fontColor ? { color: meta.fontColor } : {}
  const subFontStyle = meta.fontColor
    ? { color: meta.fontColor, opacity: 0.5 }
    : {}
  const badgeFontStyle = meta.fontColor
    ? { color: meta.fontColor, opacity: 0.35 }
    : {}

  return (
    <div
      className={cn(
        'group border-border/10 bg-background relative w-full cursor-pointer overflow-hidden rounded-t-lg border-b transition-all',
        'hover:bg-muted/30 focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none'
      )}
      style={{
        background:
          meta.coverType === 'color' ? meta.coverColor : 'var(--background)',
      }}
      onClick={() => selectNode(null)}
    >
      {/* Cover image */}
      {meta.coverType === 'image' && meta.cover && (
        <>
          <div
            className='absolute inset-0 bg-cover bg-center transition-transform duration-500'
            style={{ backgroundImage: `url(${meta.cover})` }}
          />
          <div className='absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50' />
        </>
      )}

      <div className='relative z-10 px-8 py-10 sm:px-12'>
        <input
          className='placeholder:text-foreground/40 mb-2 w-full bg-transparent text-2xl font-bold transition-colors outline-none sm:text-3xl'
          style={fontStyle}
          value={meta.title}
          placeholder='未命名问卷'
          onChange={(e) => updateMeta({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <textarea
          rows={2}
          className='placeholder:text-foreground/30 field-sizing-content w-full resize-none bg-transparent text-sm leading-relaxed transition-colors outline-none sm:text-base'
          style={subFontStyle}
          value={meta.description}
          placeholder='添加问卷描述说明...'
          onChange={(e) => updateMeta({ description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
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
