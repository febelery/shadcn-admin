import type { FileValidation } from '@/components/file-upload/types'

/** 媒体大类：与 MIME 前缀 image | video | audio 对应 */
export type MediaKind = 'image' | 'video' | 'audio'

const MB = 1024 * 1024

const MEDIA_CONFIG = {
  image: {
    label: '图片',
    accept: 'image/*',
    maxSize: 5 * MB,
    urlPlaceholder: 'https://example.com/image.jpg',
    urlFieldLabel: '图片地址',
    defaultMime: 'image/jpeg',
    defaultExt: 'jpg',
  },
  video: {
    label: '视频',
    accept: 'video/*',
    maxSize: 50 * MB,
    urlPlaceholder: 'https://example.com/video.mp4',
    urlFieldLabel: '视频地址',
    defaultMime: 'video/mp4',
    defaultExt: 'mp4',
  },
  audio: {
    label: '音频',
    accept: 'audio/*',
    maxSize: 15 * MB,
    urlPlaceholder: 'https://example.com/audio.mp3',
    urlFieldLabel: '音频地址',
    defaultMime: 'audio/mpeg',
    defaultExt: 'mp3',
  },
} as const satisfies Record<
  MediaKind,
  {
    label: string
    accept: string
    maxSize: number
    urlPlaceholder: string
    urlFieldLabel: string
    defaultMime: string
    defaultExt: string
  }
>

export function getMediaUploadValidation(kind: MediaKind): FileValidation {
  const { accept, maxSize } = MEDIA_CONFIG[kind]
  return { accept, maxFiles: 1, maxSize }
}

export function getMediaUrlPlaceholder(kind: MediaKind): string {
  return MEDIA_CONFIG[kind].urlPlaceholder
}

export function getMediaUrlFieldLabel(kind: MediaKind): string {
  return MEDIA_CONFIG[kind].urlFieldLabel
}

export function getMediaDefaultMime(kind: MediaKind): string {
  return MEDIA_CONFIG[kind].defaultMime
}

export function getMediaDefaultExtension(kind: MediaKind): string {
  return MEDIA_CONFIG[kind].defaultExt
}
