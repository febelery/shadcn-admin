import { useEffect, useId, useState } from 'react'
import { Link2 } from 'lucide-react'
import { FileUpload } from '@/components/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { MediaKind } from '@/lib/files'
import {
  getMediaUploadValidation,
  getMediaUrlFieldLabel,
  getMediaUrlPlaceholder,
} from '@/lib/files'
import { validateMediaUrl } from '../../shared/validate-media-url'

import {
  builderTypeCaption,
  builderTypeControl,
  builderTypeError,
  builderTypeLabel,
} from '../ui'


type EditorPanelProps = {
  value: string
  onChange: (url: string) => void
  mediaKind?: MediaKind
  crop?: boolean
  aspect?: number
  /** 链接输入框占位符，未传则用媒体类型默认文案 */
  urlPlaceholder?: string
  className?: string
}

/** 上传 + 链接（问卷头图等） */
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
        <span className={cn(builderTypeCaption, 'shrink-0')}>或粘贴链接</span>
        <Separator className='flex-1' />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor={inputId} className={builderTypeLabel}>
          {getMediaUrlFieldLabel(mediaKind)}
        </Label>
        <div className='relative'>
          <Link2 className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
          <Input
            id={inputId}
            className={cn('h-9 pl-8', builderTypeControl, urlError && 'border-destructive')}
            value={urlDraft}
            placeholder={
              urlPlaceholder ?? getMediaUrlPlaceholder(mediaKind)
            }
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
          <p className={builderTypeError} role='alert'>
            {urlError}
          </p>
        ) : (
          <p className={builderTypeCaption}>仅支持 http / https</p>
        )}
      </div>
    </div>
  )
}

type Props = EditorPanelProps & {
  id?: string
  className?: string
}

/** 问卷头图等媒体 URL 字段 */
export function MediaUrlField({
  value,
  onChange,
  mediaKind = 'image',
  crop,
  aspect,
  urlPlaceholder,
  className,
}: Props) {
  return (
    <div className={cn('overflow-hidden rounded-lg border bg-muted/20', className)}>
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