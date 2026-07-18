import { useId, useState } from 'react'
import { Link2 } from 'lucide-react'
import { type MediaKind, mbToBytes } from '@/lib/files'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/file-upload'
import { DEFAULT_META } from '@/features/survey/core/schema-defaults'
import { useBuilderStore } from '../../store'
import { InspectorSection } from '../inspector/panel'

const MEDIA_META = {
  image: {
    label: '图片',
    urlPlaceholder: 'https://example.com/image.jpg',
    urlFieldLabel: '图片地址',
    validation: {
      accept: 'image/*',
      maxFiles: 1,
      maxSize: mbToBytes(5),
    },
  },
  video: {
    label: '视频',
    urlPlaceholder: 'https://example.com/video.mp4',
    urlFieldLabel: '视频地址',
    validation: {
      accept: 'video/*',
      maxFiles: 1,
      maxSize: mbToBytes(50),
    },
  },
  audio: {
    label: '音频',
    urlPlaceholder: 'https://example.com/audio.mp3',
    urlFieldLabel: '音频地址',
    validation: {
      accept: 'audio/*',
      maxFiles: 1,
      maxSize: mbToBytes(15),
    },
  },
} as const

function validateMediaUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '仅支持 http 或 https 链接'
    }
    return null
  } catch {
    return '请输入有效的媒体地址'
  }
}

type EditorPanelProps = {
  value: string
  onChange: (url: string) => void
  mediaKind?: MediaKind
  crop?: boolean
  aspect?: number
  urlPlaceholder?: string
  className?: string
}

function MediaUrlEditorPanel({
  value,
  onChange,
  mediaKind = 'image',
  crop,
  aspect,
  urlPlaceholder,
  className,
}: EditorPanelProps) {
  const inputId = useId()
  const [urlDraft, setUrlDraft] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const validation = MEDIA_META[mediaKind].validation
  const enableCrop = crop && mediaKind === 'image'
  const currentUrlDraft = urlDraft ?? value

  const commitUrl = () => {
    const normalized = currentUrlDraft.trim()
    if (!normalized) {
      setUrlError(null)
      setUrlDraft(null)
      if (value) onChange('')
      return
    }
    const err = validateMediaUrl(normalized)
    if (err) {
      setUrlError(err)
      return
    }
    setUrlError(null)
    setUrlDraft(null)
    if (normalized !== value) onChange(normalized)
  }

  const handleUploadChange = (next: string | string[]) => {
    const url = typeof next === 'string' ? next : (next[0] ?? '')
    setUrlError(null)
    setUrlDraft(null)
    onChange(url)
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <FileUpload
        value={value || undefined}
        onChange={handleUploadChange}
        validation={validation}
        view='card'
        cardSize='lg'
        crop={enableCrop}
        aspect={aspect}
      />

      <div className='relative flex items-center gap-2'>
        <Separator className='flex-1' />
        <span
          className={cn(
            'text-muted-foreground text-xs leading-relaxed',
            'shrink-0'
          )}
        >
          或粘贴链接
        </span>
        <Separator className='flex-1' />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label
          htmlFor={inputId}
          className='text-muted-foreground text-xs font-medium'
        >
          {MEDIA_META[mediaKind].urlFieldLabel}
        </Label>
        <InputGroup className={cn(urlError && 'border-destructive')}>
          <InputGroupAddon align='inline-start'>
            <Link2 />
          </InputGroupAddon>
          <InputGroupInput
            id={inputId}
            className='text-xs leading-none'
            value={currentUrlDraft}
            placeholder={urlPlaceholder ?? MEDIA_META[mediaKind].urlPlaceholder}
            aria-invalid={Boolean(urlError)}
            onChange={(e) => {
              setUrlDraft(e.target.value)
              if (urlError) setUrlError(null)
            }}
            onBlur={commitUrl}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitUrl()
              }
            }}
          />
        </InputGroup>
        {urlError ? (
          <p className='text-destructive text-xs leading-relaxed' role='alert'>
            {urlError}
          </p>
        ) : (
          <p className='text-muted-foreground text-xs leading-relaxed'>
            仅支持 http / https
          </p>
        )}
      </div>
    </div>
  )
}

type MediaUrlFieldProps = EditorPanelProps & {
  id?: string
  className?: string
}

function MediaUrlField({
  value,
  onChange,
  mediaKind = 'image',
  crop,
  aspect,
  urlPlaceholder,
  className,
}: MediaUrlFieldProps) {
  return (
    <div
      className={cn('bg-muted/20 overflow-hidden rounded-lg border', className)}
    >
      <div className='p-3'>
        <MediaUrlEditorPanel
          value={value}
          onChange={onChange}
          mediaKind={mediaKind}
          crop={crop}
          aspect={aspect}
          urlPlaceholder={urlPlaceholder}
        />
      </div>
    </div>
  )
}

function CoverColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <ColorPicker
      value={value}
      onValueChange={onChange}
      defaultFormat='hex'
      className='w-full'
    >
      <ColorPickerTrigger asChild>
        <Button
          type='button'
          variant='outline'
          className='h-9 w-full justify-start gap-2 px-2 font-normal'
        >
          <ColorPickerSwatch className='size-5 shrink-0 rounded-sm' />
          <span
            className={cn(
              'text-muted-foreground font-mono text-xs leading-none tabular-nums',
              'min-w-0 flex-1 truncate text-left'
            )}
          >
            {value}
          </span>
        </Button>
      </ColorPickerTrigger>
      <ColorPickerContent align='start' className='w-auto'>
        <ColorPickerArea />
        <div className='flex flex-col gap-2'>
          <ColorPickerHueSlider />
          <ColorPickerAlphaSlider />
        </div>
        <div className='flex items-center gap-2'>
          <ColorPickerEyeDropper />
          <ColorPickerFormatSelect className='w-20 shrink-0' />
          <ColorPickerInput withoutAlpha className='min-w-0 flex-1' />
        </div>
      </ColorPickerContent>
    </ColorPicker>
  )
}

export function MetaCoverPanel() {
  const document = useBuilderStore((s) => s.document)
  const updateMeta = useBuilderStore((s) => s.updateMeta)
  const meta = document.meta

  return (
    <InspectorSection title='头图与展示' description='封面、说明与提交按钮'>
      <Field className='gap-1.5'>
        <FieldLabel className='text-muted-foreground text-xs font-medium'>
          头图样式
        </FieldLabel>
        <Tabs
          value={meta.coverType}
          onValueChange={(v) =>
            updateMeta({
              coverType: v as typeof meta.coverType,
            })
          }
        >
          <TabsList className='grid h-8 w-full grid-cols-3'>
            <TabsTrigger
              value='none'
              className={cn('px-2', 'text-xs leading-none')}
            >
              无头图
            </TabsTrigger>
            <TabsTrigger
              value='color'
              className={cn('px-2', 'text-xs leading-none')}
            >
              纯色头图
            </TabsTrigger>
            <TabsTrigger
              value='image'
              className={cn('px-2', 'text-xs leading-none')}
            >
              图片头图
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Field>

      {meta.coverType === 'color' ? (
        <Field className='gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>
            头图背景色
          </FieldLabel>
          <CoverColorPicker
            value={meta.coverColor ?? DEFAULT_META.coverColor ?? '#ffffff'}
            onChange={(coverColor) => updateMeta({ coverColor })}
          />
        </Field>
      ) : null}

      {meta.coverType === 'image' ? (
        <Field className='gap-1.5'>
          <FieldLabel className='text-muted-foreground text-xs font-medium'>
            头图图片
          </FieldLabel>
          <MediaUrlField
            value={meta.cover ?? ''}
            onChange={(cover) => updateMeta({ cover })}
            crop
            aspect={2}
          />
          <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
            上传或粘贴图片链接，保存前会校验地址
          </FieldDescription>
        </Field>
      ) : null}

      <Field className='gap-1.5'>
        <FieldLabel
          htmlFor='survey-desc'
          className='text-muted-foreground text-xs font-medium'
        >
          问卷说明
        </FieldLabel>
        <Textarea
          id='survey-desc'
          rows={3}
          value={meta.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
        />
      </Field>

      <Field className='gap-1.5'>
        <FieldLabel
          htmlFor='submit-label'
          className='text-muted-foreground text-xs font-medium'
        >
          提交按钮文案
        </FieldLabel>
        <Input
          id='submit-label'
          className='h-9'
          value={meta.submitLabel}
          onChange={(e) => updateMeta({ submitLabel: e.target.value })}
        />
      </Field>
    </InspectorSection>
  )
}
