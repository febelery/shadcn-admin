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
        'group relative w-full cursor-pointer overflow-hidden rounded-t-lg border-b border-border/10 bg-background transition-all',
        'hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
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
          className='mb-2 w-full bg-transparent text-2xl font-bold outline-none transition-colors placeholder:text-foreground/40 sm:text-3xl'
          style={fontStyle}
          value={meta.title}
          placeholder='未命名问卷'
          onChange={(e) => updateMeta({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <textarea
          rows={2}
          className='w-full resize-none bg-transparent text-sm leading-relaxed outline-none transition-colors placeholder:text-foreground/30 sm:text-base field-sizing-content'
          style={subFontStyle}
          value={meta.description}
          placeholder='添加问卷描述说明...'
          onChange={(e) => updateMeta({ description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Hover Edit Hint */}
        <div className='absolute right-6 top-6 opacity-0 transition-opacity group-hover:opacity-100'>
          <span
            className='rounded-md bg-muted/60 px-2 py-1 text-[10px] font-medium tracking-wide text-foreground/70 backdrop-blur-sm'
            style={badgeFontStyle}
          >
            编辑设置
          </span>
        </div>
      </div>
    </div>
  )
}
