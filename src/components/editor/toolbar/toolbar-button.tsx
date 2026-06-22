import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ToolbarButtonProps {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  tooltip: string
  children: React.ReactNode
}

/**
 * 独立的富文本工具栏按钮包装组件，内置 Tooltip 提示
 */
export function ToolbarButton({
  active,
  disabled,
  onClick,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            'h-8 w-8 p-0',
            active && 'bg-accent text-accent-foreground',
            'hover:bg-accent/80 transition-colors'
          )}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='bottom' className='text-xs'>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
