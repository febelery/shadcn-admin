export type { FileKind } from './kinds'
export {
  getFileKind,
  getFileKindFromExtension,
  getFileKindFromMime,
  getFileKindFromUrl,
} from './kinds'

export { formatBytes } from './format'

export {
  validateFile,
  validateFileSize,
  validateFileType,
} from './validation'

export type { MediaKind } from './media'
export {
  getMediaDefaultExtension,
  getMediaDefaultMime,
  getMediaUploadValidation,
  getMediaUrlFieldLabel,
  getMediaUrlPlaceholder,
} from './media'

export {
  createPlaceholderFileFromUrl,
  getFileNameFromUrl,
} from './url'
