import { useEffect, useId, useState } from 'react'
import { Link2 } from 'lucide-react'
import type { MediaKind } from '@/lib/files'
import {
  getMediaUploadValidation,
  getMediaUrlFieldLabel,
  getMediaUrlPlaceholder,
} from '@/lib/files'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/file-upload'
import { useBuilderStructure, useBuilderStatic } from '../../context'
import {
  InspectorColorField,
  InspectorFormField,
  InspectorSection,
} from '../inspector/primitives'

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
  const [urlDraft, setUrlDraft] = useState(value)
  const [urlError, setUrlError] = useState<string | null>(null)
  const validation = getMediaUploadValidation(mediaKind)
  const enableCrop = crop && mediaKind === 'image'

  useEffect(() => {
    setUrlDraft(value)
    if (!value.trim()) setUrlError(null)
  }, [value])

  const commitUrl = () => {
    const normalized = urlDraft.trim()
    if (!normalized) {
      setUrlError(null)
      if (value) onChange('')
      return
    }
    const err = validateMediaUrl(normalized)
    if (err) {
      setUrlError(err)
      return
    }
    setUrlError(null)
    setUrlDraft(normalized)
    if (normalized !== value) onChange(normalized)
  }

  const handleUploadChange = (next: string | string[]) => {
    const url = typeof next === 'string' ? next : (next[0] ?? '')
    setUrlError(null)
    setUrlDraft(url)
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
          {getMediaUrlFieldLabel(mediaKind)}
        </Label>
        <div className='relative'>
          <Link2 className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
          <Input
            id={inputId}
            className={cn(
              'h-9 pl-8',
              'text-xs leading-none',
              urlError && 'border-destructive'
            )}
            value={urlDraft}
            placeholder={urlPlaceholder ?? getMediaUrlPlaceholder(mediaKind)}
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
        </div>
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

export function MetaCoverPanel() {
  const { schema } = useBuilderStructure()
  const { updateMeta, DEFAULT_META } = useBuilderStatic()
  const meta = schema!.meta

  return (
    <InspectorSection title='头图与展示' description='封面、说明与提交按钮'>
      <InspectorFormField label='头图样式'>
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
      </InspectorFormField>

      {meta.coverType === 'color' ? (
        <InspectorFormField label='头图背景色'>
          <InspectorColorField
            value={meta.coverColor ?? DEFAULT_META.coverColor ?? '#ffffff'}
            onValueChange={(coverColor) => updateMeta({ coverColor })}
          />
        </InspectorFormField>
      ) : null}

      {meta.coverType === 'image' ? (
        <InspectorFormField
          label='头图图片'
          hint='上传或粘贴图片链接，保存前会校验地址'
        >
          <MediaUrlField
            value={meta.cover ?? ''}
            onChange={(cover) => updateMeta({ cover })}
            crop
            aspect={2}
          />
        </InspectorFormField>
      ) : null}

      <InspectorFormField label='问卷说明' htmlFor='survey-desc'>
        <Textarea
          id='survey-desc'
          rows={3}
          value={meta.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
        />
      </InspectorFormField>

      <InspectorFormField label='提交按钮文案' htmlFor='submit-label'>
        <Input
          id='submit-label'
          className='h-9'
          value={meta.submitLabel}
          onChange={(e) => updateMeta({ submitLabel: e.target.value })}
        />
      </InspectorFormField>
    </InspectorSection>
  )
}
