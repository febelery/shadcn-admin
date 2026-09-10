import type { Editor } from '@tiptap/react'
import { cn } from 'cn'
import { Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { fontSizes } from './toolbar-constants'

interface FontSizeDropdownProps {
  editor: Editor
  disabled?: boolean
}

/**
 * 独立的富文本编辑器字号调整下拉菜单组件
 */
export function FontSizeDropdown({ editor, disabled }: FontSizeDropdownProps) {
  const getActiveFontSizeLabel = () => {
    const fontSize = editor.getAttributes('textStyle').fontSize
    if (!fontSize) return '默认'
    return fontSize
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={disabled}
                  className='text-muted-foreground hover:bg-accent/80 flex h-8 items-center gap-1.5 px-2 text-xs transition-colors'
                >
                  <Type className='h-4 w-4 shrink-0' />
                  <span>{getActiveFontSizeLabel()}</span>
                </Button>
              }
            />
          }
        />
        <TooltipContent side='bottom' className='text-xs'>
          字号大小
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align='start'
        className='max-h-60 w-28 overflow-y-auto'
      >
        {fontSizes.map((size) => (
          <DropdownMenuItem
            key={size.label}
            onClick={() => {
              if (size.value === '') {
                editor.chain().focus().unsetFontSize().run()
              } else {
                editor.chain().focus().setFontSize(size.value).run()
              }
            }}
            className={cn(
              (size.value === '' &&
                !editor.getAttributes('textStyle').fontSize) ||
                editor.getAttributes('textStyle').fontSize === size.value
                ? 'bg-accent font-medium'
                : ''
            )}
          >
            {size.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
