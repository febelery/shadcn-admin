import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  MoveHorizontal,
  MoveVertical,
  X,
} from 'lucide-react'
import { FileItem } from './types'

interface TransformState {
  scale: number
  rotation: number
  flipH: number
  flipV: number
  translateX: number
  translateY: number
}

// 图片预览组件
export const ImagePreview = ({
  file,
  onClose,
}: {
  file: FileItem
  onClose: () => void
}) => {
  const [transformState, setTransformState] = useState<TransformState>({
    scale: 1,
    rotation: 0,
    flipH: 1,
    flipV: 1,
    translateX: 0,
    translateY: 0,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [canCloseOnBackdropClick, setCanCloseOnBackdropClick] = useState(true)
  // 添加指示器可见性状态
  const [showIndicators, setShowIndicators] = useState(false)

  // 使用refs存储最新状态，避免闭包问题
  const stateRef = useRef(transformState)
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const dragWrapperRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 更新refs以反映最新状态
  useEffect(() => {
    stateRef.current = transformState
    isDraggingRef.current = isDragging

    // 当缩放大于1时显示指示器
    setShowIndicators(transformState.scale > 1)
  }, [transformState, isDragging])

  // 计算边界函数 - 修复边界计算
  const calculateBoundaries = useCallback(() => {
    if (!imageContainerRef.current || !imageRef.current)
      return { maxX: 0, maxY: 0 }

    const imgRect = imageRef.current.getBoundingClientRect()
    const containerRect = imageContainerRef.current.getBoundingClientRect()

    // 考虑图片实际大小和旋转状态
    const isRotated = Math.abs(transformState.rotation % 180) === 90
    const effectiveImgWidth = isRotated ? imgRect.height : imgRect.width
    const effectiveImgHeight = isRotated ? imgRect.width : imgRect.height

    // 计算可移动的最大距离
    const maxX = Math.max(0, (effectiveImgWidth - containerRect.width) / 2)
    const maxY = Math.max(0, (effectiveImgHeight - containerRect.height) / 2)

    return { maxX, maxY }
  }, [transformState.rotation])

  // 更新变换状态
  const updateTransform = useCallback((newState: Partial<TransformState>) => {
    setTransformState((prev) => {
      const updated = { ...prev, ...newState }
      stateRef.current = updated

      // 当缩小时，重置位置到中心点
      if (
        'scale' in newState &&
        newState.scale !== prev.scale &&
        newState.scale !== undefined &&
        newState.scale == 1
      ) {
        updated.translateX = 0
        updated.translateY = 0
      }

      return updated
    })
  }, [])

  // 计算指示器位置和大小
  const calculateIndicators = useCallback(() => {
    if (!imageContainerRef.current || !imageRef.current)
      return { xPosition: 0, xSize: 100, yPosition: 0, ySize: 100 }

    const { maxX, maxY } = calculateBoundaries()

    // 如果没有可滚动区域，则指示器占满100%
    if (maxX <= 0) return { xPosition: 0, xSize: 100, yPosition: 0, ySize: 100 }

    // 计算指示器大小（百分比）- 容器与内容的比例
    const xSize = Math.min(100, 100 / transformState.scale)
    const ySize = Math.min(100, 100 / transformState.scale)

    // 计算指示器位置（百分比）
    const totalXRange = maxX * 2
    const xPosition =
      totalXRange > 0
        ? ((maxX - transformState.translateX) / totalXRange) * (100 - xSize)
        : 0

    const totalYRange = maxY * 2
    const yPosition =
      totalYRange > 0
        ? ((maxY - transformState.translateY) / totalYRange) * (100 - ySize)
        : 0

    return {
      xPosition: Math.max(0, Math.min(100 - xSize, xPosition)),
      xSize,
      yPosition: Math.max(0, Math.min(100 - ySize, yPosition)),
      ySize,
    }
  }, [calculateBoundaries, transformState])

  const { xPosition, xSize, yPosition, ySize } = calculateIndicators()

  // 处理鼠标移动和释放
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return

    const dx = e.clientX - lastPositionRef.current.x
    const dy = e.clientY - lastPositionRef.current.y

    lastPositionRef.current = { x: e.clientX, y: e.clientY }

    const newX = stateRef.current.translateX + dx
    const newY = stateRef.current.translateY + dy

    setTransformState((prev) => ({
      ...prev,
      translateX: newX,
      translateY: newY,
    }))

    if (dragWrapperRef.current) {
      dragWrapperRef.current.style.transform = `translate(${newX}px, ${newY}px)`
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return

    setIsDragging(false)
    isDraggingRef.current = false

    if (dragWrapperRef.current) {
      dragWrapperRef.current.style.cursor = 'grab'
    }

    // 延迟启用背景点击关闭
    setTimeout(() => setCanCloseOnBackdropClick(true), 100)

    const { maxX, maxY } = calculateBoundaries()

    let needBounce = false
    let targetX = stateRef.current.translateX
    let targetY = stateRef.current.translateY

    // 只有当超出边界时才应用弹回
    if (Math.abs(stateRef.current.translateX) > maxX) {
      needBounce = true
      targetX = stateRef.current.translateX > 0 ? maxX : -maxX
    }

    if (Math.abs(stateRef.current.translateY) > maxY) {
      needBounce = true
      targetY = stateRef.current.translateY > 0 ? maxY : -maxY
    }

    if (needBounce && dragWrapperRef.current) {
      dragWrapperRef.current.style.transition =
        'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'

      setTransformState((prev) => ({
        ...prev,
        translateX: targetX,
        translateY: targetY,
      }))

      dragWrapperRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`

      setTimeout(() => {
        if (dragWrapperRef.current) {
          dragWrapperRef.current.style.transition = ''
        }
      }, 300)
    }

    // 移除事件监听器
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [calculateBoundaries, handleMouseMove])

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
      isDraggingRef.current = true
      lastPositionRef.current = { x: e.clientX, y: e.clientY }

      if (dragWrapperRef.current) {
        dragWrapperRef.current.style.cursor = 'grabbing'
        dragWrapperRef.current.style.transition = ''
      }

      setCanCloseOnBackdropClick(false)

      // 添加全局事件监听器
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [handleMouseMove, handleMouseUp]
  )

  // 计算图片变换样式
  const imageTransform = `scale(${transformState.scale * transformState.flipH}, ${transformState.scale * transformState.flipV}) rotate(${transformState.rotation}deg)`
  const containerTransform = `translate(${transformState.translateX}px, ${transformState.translateY}px)`

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md'
      onClick={(e) =>
        e.target === e.currentTarget &&
        canCloseOnBackdropClick &&
        !isDragging &&
        onClose()
      }
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div className='relative mx-4 max-w-4xl md:mx-0'>
        {/* 工具栏 */}
        <div className='absolute -top-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-neutral-900/70 px-4 py-2 backdrop-blur-md'>
          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              updateTransform({ scale: transformState.scale + 0.5 })
            }
          >
            <ZoomIn size={20} />
          </button>
          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              transformState.scale > 1 &&
              updateTransform({ scale: transformState.scale - 0.5 })
            }
          >
            <ZoomOut size={20} />
          </button>

          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              updateTransform({ rotation: transformState.rotation - 90 })
            }
          >
            <RotateCcw size={20} />
          </button>
          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              updateTransform({ rotation: transformState.rotation + 90 })
            }
          >
            <RotateCw size={20} />
          </button>
          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              updateTransform({ flipH: transformState.flipH * -1 })
            }
          >
            <MoveHorizontal size={20} />
          </button>
          <button
            className='rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={() =>
              updateTransform({ flipV: transformState.flipV * -1 })
            }
          >
            <MoveVertical size={20} />
          </button>
          <span className='ml-2 rounded-xl bg-white/10 px-2 py-1 text-sm text-white'>
            {Math.round(transformState.scale * 100)}%
          </span>
          <button
            className='ml-2 rounded-full p-1 text-white transition-colors hover:bg-white/10'
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* 图片容器 */}
        <div
          ref={imageContainerRef}
          className='relative isolate z-[1] overflow-hidden rounded-lg border-2 border-white'
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onWheel={(e) => {
            if (e.deltaY < 0) {
              updateTransform({ scale: stateRef.current.scale + 0.5 })
            } else if (stateRef.current.scale > 1) {
              updateTransform({ scale: stateRef.current.scale - 0.5 })
            }
          }}
        >
          {/* 拖拽包装器 */}
          <div
            ref={dragWrapperRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: containerTransform,
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}
            onMouseDown={handleMouseDown}
          >
            <img
              ref={imageRef}
              src={file.url}
              alt={file.name || 'Image Preview'}
              className='max-h-[80vh] max-w-[90vw] object-contain'
              style={{
                transform: imageTransform,
                transition: 'transform 0.3s ease',
                userSelect: 'none',
              }}
            />
          </div>

          {/* 水平指示器 */}
          {showIndicators && (
            <div
              className='absolute bottom-2 left-1/2 h-1 -translate-x-1/2 rounded bg-white/20'
              style={{
                width: '80%',
                opacity: transformState.scale > 1 ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div
                className='absolute h-full rounded bg-white/60'
                style={{
                  width: `${xSize}%`,
                  left: `${xPosition}%`,
                  transition: isDragging ? 'none' : 'left 0.3s ease',
                }}
              />
            </div>
          )}

          {/* 垂直指示器 */}
          {showIndicators && (
            <div
              className='absolute top-1/2 right-2 w-1 -translate-y-1/2 rounded bg-white/20'
              style={{
                height: '80%',
                opacity: transformState.scale > 1 ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <div
                className='absolute w-full rounded bg-white/60'
                style={{
                  height: `${ySize}%`,
                  top: `${yPosition}%`,
                  transition: isDragging ? 'none' : 'top 0.3s ease',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
