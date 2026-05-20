import type { FileValidation } from '@/components/file-upload/types'

function getFileExtension(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext ? `.${ext}` : ''
}

function acceptsPattern(
  pattern: string,
  fileType: string,
  fileExtension: string
): boolean {
  if (pattern === fileType || pattern === fileExtension) return true

  if (pattern.includes('/*')) {
    const baseType = pattern.replace('/*', '')
    return fileType.startsWith(`${baseType}/`)
  }

  return fileType.startsWith(`${pattern}/`)
}

/** 校验文件类型；通过返回 null */
export function validateFileType(
  file: File,
  accept?: string | string[]
): string | null {
  if (!accept) return null

  const accepts = Array.isArray(accept) ? accept : [accept]
  const fileType = file.type
  const fileExtension = getFileExtension(file.name.toLowerCase())

  for (const pattern of accepts) {
    if (acceptsPattern(pattern, fileType, fileExtension)) return null
  }

  return '文件类型不被接受'
}

/** 校验文件体积；通过返回 null */
export function validateFileSize(
  file: File,
  maxSize?: number,
  minSize?: number
): string | null {
  if (maxSize && file.size > maxSize) {
    return `文件大小不能超过 ${(maxSize / (1024 * 1024)).toFixed(2)}MB`
  }

  if (minSize && file.size < minSize) {
    return `文件大小不能小于 ${(minSize / (1024 * 1024)).toFixed(2)}MB`
  }

  return null
}

/** 按规则校验文件；通过返回 null */
export function validateFile(file: File, rule: FileValidation): string | null {
  if (rule.validate) {
    const customError = rule.validate(file)
    if (customError) return customError
  }

  const typeError = validateFileType(file, rule.accept)
  if (typeError) return typeError

  return validateFileSize(file, rule.maxSize, rule.minSize)
}
