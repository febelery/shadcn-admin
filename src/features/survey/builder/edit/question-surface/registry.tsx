import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileUpload } from '@/components/file-upload'
import { useBuilderStatic } from '../../context'
import { LABEL_LIMITS } from '../../store'
import type { QuestionElement, QuestionConfig } from '../../types'
import { InlineEditable } from '../inline-editable'
import { SurfaceCascaderEditor } from './cascader-editor'
import { SurfaceChoiceList, SurfaceRankingList } from './choice-list'
import { SurfaceDropdownEditor } from './dropdown-editor'
import { SurfaceFillInPreview } from './fill-in-preview'
import { SurfaceLikertEditor } from './likert-editor'
import { SurfaceMatrixEditor } from './matrix-editor'

type QuestionSurfaceBodyProps = {
  question: QuestionElement
  onConfigChange: (patch: Partial<QuestionConfig>) => void
}

/** 题型 → 作答区 Surface（唯一注册点，禁止在其它文件新增 type 分支） */
export function QuestionSurfaceBody({
  question,
  onConfigChange,
}: QuestionSurfaceBodyProps) {
  const {
    partitionChoiceOptions,
    isMatrixQuestionType,
    isTextInputQuestionType,
  } = useBuilderStatic()
  const q = question
  const opts = q.config.options ?? []
  const { regular, other } = partitionChoiceOptions(opts)
  const choiceOpts = other ? [...regular, other] : regular
  const setOptions = (options: typeof opts) => onConfigChange({ options })

  if (q.type === 'single_choice') {
    return (
      <SurfaceChoiceList
        question={q}
        mode='single'
        options={choiceOpts}
        onChange={setOptions}
        onConfigChange={onConfigChange}
        showAllowOther
      />
    )
  }

  if (q.type === 'dropdown') {
    const { regular } = partitionChoiceOptions(opts)
    return (
      <SurfaceDropdownEditor
        question={q}
        options={regular}
        onChange={setOptions}
      />
    )
  }

  if (q.type === 'multiple_choice') {
    return (
      <SurfaceChoiceList
        question={q}
        mode='multiple'
        options={choiceOpts}
        onChange={setOptions}
        onConfigChange={onConfigChange}
        showAllowOther
      />
    )
  }

  if (q.type === 'ranking') {
    return <SurfaceRankingList options={choiceOpts} onChange={setOptions} />
  }

  if (isTextInputQuestionType(q.type) || q.type === 'number') {
    return (
      <div className='border-border/80 border-b pb-2'>
        <InlineEditable
          value={q.config.placeholder ?? ''}
          onChange={(placeholder) => onConfigChange({ placeholder })}
          placeholder='请输入…'
          maxLength={LABEL_LIMITS.placeholder}
          className={cn(
            'text-muted-foreground/80 max-w-full',
            'placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
          )}
        />
      </div>
    )
  }

  if (q.type === 'textarea') {
    return (
      <div className='border-border/80 min-h-[88px] rounded-md border border-dashed px-3 py-3'>
        <InlineEditable
          value={q.config.placeholder ?? ''}
          onChange={(placeholder) => onConfigChange({ placeholder })}
          placeholder='请输入详细内容…'
          multiline
          className={cn(
            'text-muted-foreground/80',
            'placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
          )}
        />
      </div>
    )
  }

  if (q.type === 'rating') {
    const n = q.config.starCount ?? 5
    return (
      <div className='flex gap-1'>
        {Array.from({ length: n }).map((_, i) => (
          <Star
            key={i}
            className='text-muted-foreground/40 h-7 w-7 stroke-[1.25]'
          />
        ))}
      </div>
    )
  }

  if (q.type === 'nps') {
    return (
      <div className='flex flex-col gap-2'>
        <div
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'flex justify-between gap-2'
          )}
        >
          <InlineEditable
            value={q.config.npsLeftLabel ?? ''}
            onChange={(npsLeftLabel) => onConfigChange({ npsLeftLabel })}
            placeholder='完全不可能'
            maxLength={LABEL_LIMITS.npsLabel}
            className='max-w-[45%] min-w-0 flex-1 truncate'
            compact
          />
          <InlineEditable
            value={q.config.npsRightLabel ?? ''}
            onChange={(npsRightLabel) => onConfigChange({ npsRightLabel })}
            placeholder='非常可能'
            maxLength={LABEL_LIMITS.npsLabel}
            className='max-w-[45%] min-w-0 flex-1 truncate text-right'
            compact
          />
        </div>
        <div className='flex flex-wrap gap-1'>
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'text-sm leading-relaxed',
                'text-muted-foreground/60 border-border/60 flex h-9 w-9 items-center justify-center rounded-md border'
              )}
            >
              {i}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (q.type === 'slider') {
    return (
      <div className='bg-muted/40 h-1.5 w-full rounded-full'>
        <div className='bg-primary/40 h-full w-1/3 rounded-full' />
      </div>
    )
  }

  if (q.type === 'date' || q.type === 'date_range') {
    return (
      <div
        className={cn(
          'border-border/80 text-muted-foreground/70 inline-flex min-w-[200px] border-b pb-2',
          'placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
        )}
      >
        {q.type === 'date_range' ? '开始日期 — 结束日期' : '选择日期'}
      </div>
    )
  }

  if (q.type === 'file_upload') {
    const { acceptTypes, maxCount = 3, maxSize = 10 } = q.config
    return (
      <FileUpload
        validation={{
          accept: acceptTypes?.length ? acceptTypes : undefined,
          maxFiles: Math.max(1, maxCount),
          maxSize: Math.max(1, maxSize) * 1024 * 1024,
        }}
        view='list'
        disabled
        className='pointer-events-none'
      />
    )
  }

  if (q.type === 'signature') {
    return (
      <div
        className={cn(
          'text-sm leading-relaxed',
          'border-border/60 text-muted-foreground/60 flex min-h-[100px] items-center justify-center rounded-lg border border-dashed'
        )}
      >
        签名区域
      </div>
    )
  }

  if (isMatrixQuestionType(q.type)) {
    return <SurfaceMatrixEditor question={q} onConfigChange={onConfigChange} />
  }

  if (q.type === 'likert') {
    return <SurfaceLikertEditor question={q} onConfigChange={onConfigChange} />
  }

  if (q.type === 'cascader') {
    return <SurfaceCascaderEditor question={q} />
  }

  if (q.type === 'fill_in') {
    return <SurfaceFillInPreview title={q.title} />
  }

  if (q.type === 'dynamic_panel') {
    return (
      <p className={cn('text-sm leading-relaxed', 'text-muted-foreground/70')}>
        重复组 · {q.config.minItems ?? 1}–{q.config.maxItems ?? 5} 条
        {(q.config.templateElements?.length ?? 0) > 0
          ? ` · 模板 ${q.config.templateElements!.length} 项`
          : ''}
      </p>
    )
  }

  return null
}
