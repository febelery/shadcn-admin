import type { Editor } from '@tiptap/react'
import { Heading, Heading1, Heading2, Heading3 } from 'lucide-react'
import { cn } from '@/lib/utils'
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

interface FormatDropdownProps {
  editor: Editor
  disabled?: boolean
}

/**
 * 独立的排版格式（正文与多级标题）下拉选择组件
 */
export function FormatDropdown({ editor, disabled }: FormatDropdownProps) {
  const getCurrentFormatLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return '标题 1'
    if (editor.isActive('heading', { level: 2 })) return '标题 2'
    if (editor.isActive('heading', { level: 3 })) return '标题 3'
    return '正文'
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={disabled}
              className='text-muted-foreground hover:bg-accent/80 flex h-8 items-center gap-1.5 px-2 text-xs transition-colors'
            >
              <Heading className='h-4 w-4 shrink-0' />
              <span>{getCurrentFormatLabel()}</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          段落与标题格式
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align='start' className='w-32'>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(
            editor.isActive('paragraph') && 'bg-accent font-medium'
          )}
        >
          正文
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(
            editor.isActive('heading', { level: 1 }) && 'bg-accent font-medium'
          )}
        >
          <Heading1 className='mr-2 h-4 w-4' />
          标题 1
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={cn(
            editor.isActive('heading', { level: 2 }) && 'bg-accent font-medium'
          )}
        >
          <Heading2 className='mr-2 h-4 w-4' />
          标题 2
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={cn(
            editor.isActive('heading', { level: 3 }) && 'bg-accent font-medium'
          )}
        >
          <Heading3 className='mr-2 h-4 w-4' />
          标题 3
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
