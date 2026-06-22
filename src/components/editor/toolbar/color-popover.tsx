import { Editor } from '@tiptap/react'
import { Palette, Highlighter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PRESET_COLORS, PRESET_HIGHLIGHTS } from './toolbar-constants'

interface ColorPopoverProps {
  editor: Editor
  disabled?: boolean
}

/**
 * 独立的文字颜色和背景高亮颜色选择器 Popover 组件
 */
export function ColorPopover({ editor, disabled }: ColorPopoverProps) {
  const getActiveColor = () => {
    return editor.getAttributes('textStyle').color || ''
  }

  return (
    <>
      {/* 文字颜色 */}
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className={cn(
                  'h-8 w-8 p-0',
                  getActiveColor() !== '' &&
                    'bg-accent/80 text-accent-foreground',
                  'hover:bg-accent/80 transition-colors'
                )}
                disabled={disabled}
              >
                <Palette
                  className='h-4 w-4'
                  style={{ color: getActiveColor() || undefined }}
                />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side='bottom' className='text-xs'>
            文字颜色
          </TooltipContent>
        </Tooltip>
        <PopoverContent className='w-48 p-2.5' align='start'>
          <div className='grid grid-cols-5 gap-1.5'>
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                type='button'
                className={cn(
                  'group border-border/60 relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95',
                  color.value === '' && 'border-dashed'
                )}
                style={{ backgroundColor: color.value || 'transparent' }}
                onClick={() => {
                  if (color.value === '') {
                    editor.chain().focus().unsetColor().run()
                  } else {
                    editor.chain().focus().setColor(color.value).run()
                  }
                }}
                title={color.name}
              >
                {color.value === '' && (
                  <span className='text-muted-foreground group-hover:text-foreground text-[10px] font-semibold'>
                    ×
                  </span>
                )}
                {getActiveColor() === color.value && color.value !== '' && (
                  <span className='absolute inset-0 m-auto h-2 w-2 rounded-full bg-white shadow-xs ring-1 ring-black/10' />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 背景高亮 */}
      <Popover>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className={cn(
                  'h-8 w-8 p-0',
                  editor.isActive('highlight') &&
                    'bg-accent/80 text-accent-foreground',
                  'hover:bg-accent/80 transition-colors'
                )}
                disabled={disabled}
              >
                <Highlighter className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side='bottom' className='text-xs'>
            背景高亮
          </TooltipContent>
        </Tooltip>
        <PopoverContent className='w-40 p-2.5' align='start'>
          <div className='grid grid-cols-4 gap-1.5'>
            {PRESET_HIGHLIGHTS.map((color) => (
              <button
                key={color.name}
                type='button'
                className={cn(
                  'group border-border/60 relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-105 active:scale-95',
                  color.value === '' && 'border-dashed'
                )}
                style={{ backgroundColor: color.value || 'transparent' }}
                onClick={() => {
                  if (color.value === '') {
                    editor.chain().focus().unsetHighlight().run()
                  } else {
                    editor
                      .chain()
                      .focus()
                      .setHighlight({ color: color.value })
                      .run()
                  }
                }}
                title={color.name}
              >
                {color.value === '' && (
                  <span className='text-muted-foreground group-hover:text-foreground text-[10px] font-semibold'>
                    ×
                  </span>
                )}
                {editor.isActive('highlight', { color: color.value }) &&
                  color.value !== '' && (
                    <span className='absolute inset-0 m-auto h-2 w-2 rounded-full bg-slate-800 shadow-xs' />
                  )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
