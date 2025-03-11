import { X } from 'lucide-react'
import { FileItem } from './types'

// 视频预览组件
export const VideoPreview = ({
  file,
  onClose,
}: {
  file: FileItem
  onClose: () => void
}) => (
  <div
    className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md'
    onClick={(e) => e.target === e.currentTarget && onClose()}
    style={{ animation: 'fadeIn 0.3s ease' }}
  >
    <div className='relative mx-4 aspect-video w-full max-w-4xl md:mx-0'>
      <button
        className='absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md'
        onClick={onClose}
      >
        <X size={20} />
      </button>

      <div className='relative isolate z-[1] h-full w-full overflow-hidden rounded-2xl border-2 border-white'>
        <video
          src={file.url}
          className='h-full w-full rounded-2xl'
          controls
          autoPlay
          style={{
            animation: 'scaleIn 0.3s ease',
          }}
        />
      </div>
    </div>
  </div>
)
