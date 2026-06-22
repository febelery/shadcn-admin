import * as React from 'react'
import { Editor } from '@tiptap/react'
import { Link, Link2Off } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface LinkPopoverProps {
  editor: Editor
  disabled?: boolean
}

/**
 * 独立的富文本编辑器插入/编辑超链接 Popover 组件
 */
export function LinkPopover({ editor, disabled }: LinkPopoverProps) {
  const [linkUrl, setLinkUrl] = React.useState('')
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // 链接插入或更新
  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl.trim() })
        .run()
    }
    setIsPopoverOpen(false)
  }

  // 点击链接按钮时回填已有 URL
  const handleLinkOpen = (open: boolean) => {
    setIsPopoverOpen(open)
    if (open) {
      setLinkUrl(editor.getAttributes('link').href || '')
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleLinkOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('link') && 'bg-accent text-accent-foreground',
                'hover:bg-accent/80 transition-colors'
              )}
              disabled={disabled}
            >
              <Link className='h-4 w-4' />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side='bottom' className='text-xs'>
          超链接
        </TooltipContent>
      </Tooltip>
      <PopoverContent className='w-80 p-3' align='start'>
        <div className='space-y-3'>
          <h4 className='text-foreground text-xs font-semibold'>
            {editor.isActive('link') ? '编辑超链接' : '添加超链接'}
          </h4>
          <div className='flex gap-2'>
            <Input
              placeholder='请输入链接 URL...'
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className='h-8 text-xs'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSetLink()
              }}
            />
            <Button size='sm' className='h-8 text-xs' onClick={handleSetLink}>
              确定
            </Button>
          </div>
          {editor.isActive('link') && (
            <Button
              variant='ghost'
              size='sm'
              className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-full justify-start text-xs'
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                setIsPopoverOpen(false)
              }}
            >
              <Link2Off className='mr-2 h-3.5 w-3.5' />
              取消链接
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
