import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ImagePlus, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useFileUploadContext } from '@/components/file-upload/context'

function usePreviewUrl(file?: File, url?: string) {
  const [blobUrl, setBlobUrl] = useState<string>()

  useEffect(() => {
    if (!file || file.size === 0 || url) {
      setBlobUrl(undefined)
      return
    }
    const nextUrl = URL.createObjectURL(file)
    setBlobUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file, url])

  return url || blobUrl
}

export function CoverUploadSurface() {
  const { items, addFiles, removeFile, validation } = useFileUploadContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const item = items[0]
  const previewUrl = usePreviewUrl(item?.file, item?.url)
  const accept = Array.isArray(validation?.accept)
    ? validation.accept.join(',')
    : validation?.accept

  const openPicker = () => inputRef.current?.click()

  return (
    <div className='space-y-2'>
      <input
        ref={inputRef}
        type='file'
        className='sr-only'
        accept={accept}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length) addFiles(files)
          event.target.value = ''
        }}
      />

      {item ? (
        <>
          <div className='bg-muted relative aspect-[2/1] overflow-hidden rounded-md border'>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt='头图预览'
                className='size-full object-cover'
              />
            ) : (
              <div className='text-muted-foreground flex size-full items-center justify-center'>
                <ImagePlus className='size-7' />
              </div>
            )}
            {item.status === 'uploading' ? (
              <div className='bg-background/90 absolute inset-x-0 bottom-0 space-y-1.5 p-2 backdrop-blur-sm'>
                <div className='flex items-center justify-between text-xs'>
                  <span>正在上传</span>
                  <span className='font-mono tabular-nums'>
                    {item.progress}%
                  </span>
                </div>
                <Progress value={item.progress} className='h-1.5' />
              </div>
            ) : null}
            {item.status === 'error' ? (
              <div className='bg-destructive/90 absolute inset-x-0 bottom-0 flex items-center gap-1.5 px-2 py-1.5 text-xs text-white'>
                <AlertCircle className='size-3.5' />
                <span className='truncate'>{item.error ?? '上传失败'}</span>
              </div>
            ) : null}
          </div>
          <div className='flex items-center justify-between gap-2'>
            <p className='text-muted-foreground min-w-0 truncate text-xs'>
              {item.file.name}
            </p>
            <div className='flex shrink-0 items-center gap-1'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={openPicker}
              >
                <Upload />
                替换
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8'
                aria-label='移除头图'
                onClick={() => removeFile(item.id)}
              >
                <X />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <button
          type='button'
          className={cn(
            'bg-muted/20 text-muted-foreground flex aspect-[2/1] w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed transition-colors',
            'hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
          )}
          onClick={openPicker}
        >
          <ImagePlus className='size-7' />
          <span className='text-sm font-medium'>选择头图</span>
        </button>
      )}
    </div>
  )
}
