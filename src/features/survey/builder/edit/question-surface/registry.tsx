import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileUpload } from '@/components/file-upload'
import { partitionChoiceOptions } from '@/features/survey/core/choice-other-option'
import type {
  QuestionConfigPatch,
  QuestionElement,
  QuestionType,
} from '../../../core/types'
import { BUILDER_TEXT_LIMITS } from '../../shared/text-limits'
import { InlineEditable } from '../inline-editable'
import { SurfaceCascaderEditor } from './cascader-editor'
import { SurfaceChoiceList, SurfaceRankingList } from './choice-list'
import { SurfaceDropdownEditor } from './dropdown-editor'
import { SurfaceLikertEditor } from './likert-editor'
import { SurfaceMatrixEditor } from './matrix-editor'

type SurfaceProps = {
  question: QuestionElement
  onConfigChange: (patch: QuestionConfigPatch) => void
}

type SurfaceAdapter = (props: SurfaceProps) => React.ReactNode

function choiceSurface(mode: 'single' | 'multiple'): SurfaceAdapter {
  return ({ question, onConfigChange }) => {
    const options = question.config.options ?? []
    const { regular, other } = partitionChoiceOptions(options)
    return (
      <SurfaceChoiceList
        question={question}
        mode={mode}
        options={other ? [...regular, other] : regular}
        onChange={(next) => onConfigChange({ options: next })}
        onConfigChange={onConfigChange}
        showOtherOptionToggle
      />
    )
  }
}

const dropdownSurface: SurfaceAdapter = ({ question, onConfigChange }) => {
  const { regular } = partitionChoiceOptions(question.config.options ?? [])
  return (
    <SurfaceDropdownEditor
      question={question}
      options={regular}
      onChange={(options) => onConfigChange({ options })}
    />
  )
}

const rankingSurface: SurfaceAdapter = ({ question, onConfigChange }) => {
  const options = question.config.options ?? []
  const { regular, other } = partitionChoiceOptions(options)
  return (
    <SurfaceRankingList
      options={other ? [...regular, other] : regular}
      onChange={(next) => onConfigChange({ options: next })}
    />
  )
}

const inlineTextSurface: SurfaceAdapter = ({ question, onConfigChange }) => (
  <div className='border-border/80 border-b pb-2'>
    <InlineEditable
      value={question.config.placeholder ?? ''}
      onChange={(placeholder) => onConfigChange({ placeholder })}
      placeholder='请输入…'
      maxLength={BUILDER_TEXT_LIMITS.placeholder}
      className={cn(
        'text-muted-foreground/80 max-w-full',
        'placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
      )}
    />
  </div>
)

const textareaSurface: SurfaceAdapter = ({ question, onConfigChange }) => (
  <div className='border-border/80 min-h-[88px] rounded-md border border-dashed px-3 py-3'>
    <InlineEditable
      value={question.config.placeholder ?? ''}
      onChange={(placeholder) => onConfigChange({ placeholder })}
      placeholder='请输入详细内容…'
      multiline
      className='text-muted-foreground/80 placeholder:text-muted-foreground/50 text-sm leading-relaxed font-normal'
    />
  </div>
)

const ratingSurface: SurfaceAdapter = ({ question }) => (
  <div className='flex gap-1'>
    {Array.from({ length: question.config.starCount ?? 5 }).map((_, index) => (
      <Star
        key={index}
        className='text-muted-foreground/40 h-7 w-7 stroke-[1.25]'
      />
    ))}
  </div>
)

const npsSurface: SurfaceAdapter = ({ question, onConfigChange }) => (
  <div className='flex flex-col gap-2'>
    <div className='text-muted-foreground flex justify-between gap-2 text-xs leading-relaxed'>
      <InlineEditable
        value={question.config.npsLeftLabel ?? ''}
        onChange={(npsLeftLabel) => onConfigChange({ npsLeftLabel })}
        placeholder='完全不可能'
        maxLength={BUILDER_TEXT_LIMITS.npsLabel}
        className='max-w-[45%] min-w-0 flex-1 truncate'
        compact
      />
      <InlineEditable
        value={question.config.npsRightLabel ?? ''}
        onChange={(npsRightLabel) => onConfigChange({ npsRightLabel })}
        placeholder='非常可能'
        maxLength={BUILDER_TEXT_LIMITS.npsLabel}
        className='max-w-[45%] min-w-0 flex-1 truncate text-right'
        compact
      />
    </div>
    <div className='flex flex-wrap gap-1'>
      {Array.from({ length: 11 }).map((_, index) => (
        <span
          key={index}
          className='text-muted-foreground/60 border-border/60 flex h-9 w-9 items-center justify-center rounded-md border text-sm leading-relaxed'
        >
          {index}
        </span>
      ))}
    </div>
  </div>
)

const sliderSurface: SurfaceAdapter = () => (
  <div className='bg-muted/40 h-1.5 w-full rounded-full'>
    <div className='bg-primary/40 h-full w-1/3 rounded-full' />
  </div>
)

const dateSurface: SurfaceAdapter = ({ question }) => (
  <div className='border-border/80 text-muted-foreground/70 placeholder:text-muted-foreground/50 inline-flex min-w-[200px] border-b pb-2 text-sm leading-relaxed font-normal'>
    {question.type === 'date_range' ? '开始日期 — 结束日期' : '选择日期'}
  </div>
)

const fileUploadSurface: SurfaceAdapter = ({ question }) => {
  const { acceptTypes, maxCount = 3, maxSize = 10 } = question.config
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

const matrixSurface: SurfaceAdapter = ({ question, onConfigChange }) => (
  <SurfaceMatrixEditor question={question} onConfigChange={onConfigChange} />
)
const likertSurface: SurfaceAdapter = ({ question, onConfigChange }) => (
  <SurfaceLikertEditor question={question} onConfigChange={onConfigChange} />
)
const cascaderSurface: SurfaceAdapter = ({ question }) => (
  <SurfaceCascaderEditor question={question} />
)
const SURFACE_ADAPTERS: Record<QuestionType, SurfaceAdapter> = {
  single_choice: choiceSurface('single'),
  multiple_choice: choiceSurface('multiple'),
  dropdown: dropdownSurface,
  ranking: rankingSurface,
  matrix_single: matrixSurface,
  matrix_multiple: matrixSurface,
  cascader: cascaderSurface,
  text: inlineTextSurface,
  textarea: textareaSurface,
  number: inlineTextSurface,
  email: inlineTextSurface,
  phone: inlineTextSurface,
  url: inlineTextSurface,
  date: dateSurface,
  date_range: dateSurface,
  rating: ratingSurface,
  slider: sliderSurface,
  nps: npsSurface,
  likert: likertSurface,
  file_upload: fileUploadSurface,
}

export function QuestionSurfaceBody(props: SurfaceProps) {
  return SURFACE_ADAPTERS[props.question.type](props)
}
