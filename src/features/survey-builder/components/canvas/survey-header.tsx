import { cn } from '@/lib/utils'
import { useBuilderStore } from '@/features/survey-builder/store'

export function SurveyHeader() {
  const { meta, updateMeta, setContextMode } = useBuilderStore()
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
        'group relative w-full max-w-3xl cursor-pointer overflow-hidden rounded-sm transition-all duration-300 xl:max-w-4xl 2xl:max-w-5xl'
      )}
      style={{
        background:
          meta.coverType === 'color' ? meta.coverColor : 'hsl(0 0% 9%)',
      }}
      onClick={() => setContextMode('survey')}
    >
      {/* Cover image */}
      {meta.coverType === 'image' && meta.cover && (
        <>
          <div
            className='absolute inset-0 bg-cover bg-center'
            style={{ backgroundImage: `url(${meta.cover})` }}
          />
          <div className='absolute inset-0 bg-black/50' />
        </>
      )}

      {/* Subtle shimmer effect */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'linear-gradient(135deg,transparent 40%,rgba(255,255,255,.04) 50%,transparent 60%)',
          backgroundSize: '200% 200%',
        }}
      />

      <div className='relative z-2 px-6 py-5'>
        <input
          className='mb-1 w-full bg-transparent text-[20px] font-bold tracking-tight transition-colors outline-none placeholder:text-white'
          style={fontStyle}
          value={meta.title}
          placeholder='问卷标题'
          onChange={(e) => updateMeta({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <textarea
          rows={2}
          className='w-full resize-none bg-transparent text-xs leading-relaxed transition-colors outline-none placeholder:text-white'
          style={subFontStyle}
          value={meta.description}
          placeholder='添加问卷描述…'
          onChange={(e) => updateMeta({ description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
        />
        <div className='mt-3 flex items-center justify-end'>
          <span
            className='text-[10px] opacity-0 transition-opacity group-hover:opacity-100'
            style={badgeFontStyle}
          >
            编辑设置
          </span>
        </div>
      </div>
    </div>
  )
}
