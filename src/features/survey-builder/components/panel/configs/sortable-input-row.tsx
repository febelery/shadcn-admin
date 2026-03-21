'use client'
import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface SortableInputRowProps {
  id: string
  value: string
  onChange: (val: string) => void
  onDelete: () => void
  onEnter: () => void
  onBackspaceEmpty?: () => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  isFocused?: boolean
  prefix?: React.ReactNode
  extraFields?: React.ReactNode
  showGrip?: boolean
}

export function SortableInputRow({
  id,
  value,
  onChange,
  onDelete,
  onEnter,
  onBackspaceEmpty,
  onFocus,
  onBlur,
  placeholder,
  className,
  isFocused,
  prefix,
  extraFields,
  showGrip = true,
}: SortableInputRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group border-border/40 flex items-start gap-1.5 border-b px-2 py-1 last:border-0',
        isDragging && 'bg-muted/60 z-50 rounded shadow-sm',
        isFocused && 'bg-muted/30',
        className
      )}
    >
      {/* 拖拽手柄 */}
      {showGrip && (
        <button
          {...attributes}
          {...listeners}
          tabIndex={-1}
          className='text-border/50 hover:text-muted-foreground mt-1.5 shrink-0 cursor-grab transition-colors active:cursor-grabbing'
        >
          <GripVertical className='h-3 w-3' />
        </button>
      )}

      {/* 前缀 (如：序号) */}
      {prefix}

      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        {/* 主输入框 */}
        <Input
          ref={inputRef}
          data-opt-id={id} // 用于添加选项后的聚焦
          className='placeholder:text-muted-foreground/30 h-7 border-0 bg-transparent px-0 text-xs shadow-none ring-0 focus-visible:ring-0'
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEnter()
            }
            if (e.key === 'Backspace' && !value && onBackspaceEmpty) {
              e.preventDefault()
              onBackspaceEmpty()
            }
          }}
        />

        {/* 额外字段 (如：图片 URL 输入框) */}
        {extraFields}
      </div>

      {/* 删除按钮 */}
      <button
        tabIndex={-1}
        className='text-border/30 hover:text-destructive mt-1.5 shrink-0 opacity-0 transition-all group-hover:opacity-100'
        onClick={onDelete}
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  )
}
