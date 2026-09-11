import type { ComponentType } from 'react'
import {
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from '@/components/ui/attachment'
import type { FileItem } from '@/components/file-upload'
import type { AttachmentItem } from '../../core/types'

type IconComponent = ComponentType<{ className?: string }>

interface IconMapping {
  Icon: IconComponent
  colorClass: string
}

/**
 * 文件扩展名到图标与配色的静态映射表 (O(1) 查表)
 * 新增扩展名支持仅需在此追加一行，杜绝多层 if/else
 */
const EXT_ICON_MAP: Record<string, IconMapping> = {
  // 图片类型
  png: { Icon: FileImage, colorClass: 'text-emerald-500' },
  jpg: { Icon: FileImage, colorClass: 'text-emerald-500' },
  jpeg: { Icon: FileImage, colorClass: 'text-emerald-500' },
  svg: { Icon: FileImage, colorClass: 'text-emerald-500' },
  webp: { Icon: FileImage, colorClass: 'text-emerald-500' },
  gif: { Icon: FileImage, colorClass: 'text-emerald-500' },
  // PDF 文档
  pdf: { Icon: FileText, colorClass: 'text-red-500' },
  // 编程语言与代码
  ts: { Icon: FileCode, colorClass: 'text-blue-500' },
  tsx: { Icon: FileCode, colorClass: 'text-blue-500' },
  js: { Icon: FileCode, colorClass: 'text-blue-500' },
  jsx: { Icon: FileCode, colorClass: 'text-blue-500' },
  json: { Icon: FileCode, colorClass: 'text-blue-500' },
  py: { Icon: FileCode, colorClass: 'text-blue-500' },
  go: { Icon: FileCode, colorClass: 'text-blue-500' },
  rs: { Icon: FileCode, colorClass: 'text-blue-500' },
  html: { Icon: FileCode, colorClass: 'text-blue-500' },
  css: { Icon: FileCode, colorClass: 'text-blue-500' },
  sql: { Icon: FileCode, colorClass: 'text-blue-500' },
  // 压缩文件
  zip: { Icon: FileArchive, colorClass: 'text-amber-500' },
  rar: { Icon: FileArchive, colorClass: 'text-amber-500' },
  tar: { Icon: FileArchive, colorClass: 'text-amber-500' },
  gz: { Icon: FileArchive, colorClass: 'text-amber-500' },
  '7z': { Icon: FileArchive, colorClass: 'text-amber-500' },
  // 电子表格
  xlsx: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600' },
  xls: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600' },
  csv: { Icon: FileSpreadsheet, colorClass: 'text-emerald-600' },
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 将 FileUpload 层的 FileItem 转换为 Chat 业务层的 AttachmentItem
 */
export function fileItemToAttachment(item: FileItem): AttachmentItem {
  const isImage = item.file.type.startsWith('image/')
  return {
    id: item.id,
    name: item.file.name,
    size: formatFileSize(item.file.size),
    mediaType: item.file.type || 'application/octet-stream',
    url: item.url,
    isImage,
  }
}

/**
 * 依据文件名后缀与媒体类型呈现彩色徽标图标
 */
export function FileIconBadge({
  filename = '',
  type = '',
}: {
  filename?: string
  type?: string
}) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  // MIME 快速匹配
  if (type.startsWith('image/')) {
    return <FileImage className='size-3.5 text-emerald-500' />
  }
  if (type.includes('pdf')) {
    return <FileText className='size-3.5 text-red-500' />
  }

  // 查表匹配
  const match = EXT_ICON_MAP[ext]
  if (match) {
    const { Icon, colorClass } = match
    return <Icon className={`size-3.5 ${colorClass}`} />
  }

  return <FileText className='text-primary size-3.5' />
}

export interface ChatInputAttachmentsProps {
  items: FileItem[]
  onRemove: (id: string) => void
}

/**
 * 待发送附件列表区域（展示横向排布的 Attachment 卡片）
 */
export function ChatInputAttachments({
  items,
  onRemove,
}: ChatInputAttachmentsProps) {
  if (items.length === 0) return null

  return (
    <div className='border-border/40 mb-2 border-b px-1 pb-2.5'>
      <AttachmentGroup className='gap-2 py-0.5'>
        {items.map((item) => {
          const att = fileItemToAttachment(item)
          return (
            <Attachment
              key={item.id}
              size='xs'
              orientation='horizontal'
              className='bg-background/90 shadow-2xs'
            >
              <AttachmentMedia variant={att.isImage ? 'image' : 'icon'}>
                {att.isImage && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className='size-full rounded-xs object-cover'
                  />
                ) : (
                  <FileIconBadge filename={att.name} type={att.mediaType} />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{att.name}</AttachmentTitle>
                <AttachmentDescription>{att.size}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  aria-label={`移除 ${att.name}`}
                  onClick={() => onRemove(item.id)}
                  title='移除附件'
                >
                  <X className='size-3' />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          )
        })}
      </AttachmentGroup>
    </div>
  )
}
