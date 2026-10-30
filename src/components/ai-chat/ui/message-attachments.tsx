import { DownloadIcon } from 'lucide-react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import type { ChatPart } from '../tools/types'
import { FileIconBadge } from './chat-input/chat-attachments'

type FilePart = Extract<ChatPart, { type: 'file' }>

function isImageMediaType(mediaType = '', filename = ''): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return (
    mediaType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)
  )
}

function formatMediaType(mediaType = ''): string {
  if (mediaType.includes('pdf')) return 'PDF 文档'
  if (mediaType.includes('json')) return 'JSON 数据'
  if (mediaType.includes('text') || mediaType.includes('plain'))
    return '文本文档'
  if (mediaType.startsWith('image/')) return '图片文件'
  return mediaType || '文件附件'
}

export function MessageFileParts({
  parts,
  size = 'default',
}: {
  parts: FilePart[]
  size?: 'sm' | 'default'
}) {
  if (parts.length === 0) return null

  return (
    <AttachmentGroup>
      {parts.map((part, index) => {
        const isImage = isImageMediaType(part.mediaType, part.filename)
        return (
          <Attachment key={index} size={size}>
            <AttachmentMedia variant={isImage ? 'image' : 'icon'}>
              {isImage && part.url ? (
                <img
                  src={part.url}
                  alt={part.filename}
                  className='size-full object-cover'
                />
              ) : (
                <FileIconBadge filename={part.filename} type={part.mediaType} />
              )}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{part.filename}</AttachmentTitle>
              <AttachmentDescription>
                {formatMediaType(part.mediaType)}
              </AttachmentDescription>
            </AttachmentContent>
            {part.url && (
              <>
                <AttachmentTrigger
                  render={
                    <a
                      href={part.url}
                      target='_blank'
                      rel='noreferrer'
                      aria-label={`查看 ${part.filename}`}
                    />
                  }
                />
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={`下载 ${part.filename}`}
                    render={<a href={part.url} download={part.filename} />}
                  >
                    <DownloadIcon />
                  </AttachmentAction>
                </AttachmentActions>
              </>
            )}
          </Attachment>
        )
      })}
    </AttachmentGroup>
  )
}
