/**
 * 编辑器图片上传 — 接入项目全局七牛云 defaultUpload
 *
 * 对外暴露 uploadImageWithProgress，支持实时进度回调，
 * 供工具栏在编辑器内渲染可视化上传进度。
 */
import { defaultUpload } from '@/config/upload'

export interface ImageUploadOptions {
  /** 进度回调，0–100 */
  onProgress?: (percent: number) => void
}

/**
 * 上传图片到七牛云，支持进度反馈
 * @param file 待上传的图片文件
 * @param options 可选配置（进度回调）
 * @returns 上传成功后返回可访问的图片 URL
 */
export async function uploadImageWithProgress(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  // 基础校验：只允许图片类型
  if (!file.type.startsWith('image/')) {
    throw new Error('只允许上传图片文件')
  }

  // 文件大小限制 10MB（与全局配置保持一致）
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('图片大小不能超过 10MB')
  }

  // 调用项目全局上传函数，透传进度回调
  return defaultUpload(file, { onProgress: options.onProgress })
}

/**
 * 生成本地 blob 预览 URL（用于上传前立即显示缩略图）
 */
export function createBlobPreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * 释放 blob URL，避免内存泄漏
 */
export function revokeBlobPreview(blobUrl: string): void {
  if (blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(blobUrl)
  }
}
