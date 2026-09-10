import { cn } from 'cn'
import { CircleQuestionMark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type LearnMoreProps = Omit<React.ComponentProps<typeof Popover>, 'children'> & {
  children?: React.ReactNode
  contentProps?: React.ComponentProps<typeof PopoverContent>
  triggerProps?: React.ComponentProps<typeof PopoverTrigger>
}

export function LearnMore({
  children,
  contentProps,
  triggerProps,
  ...props
}: LearnMoreProps) {
  return (
    <Popover {...props}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            className={cn('size-5 rounded-full', triggerProps?.className)}
          >
            <span className='sr-only'>了解更多</span>
            <CircleQuestionMark className='size-4 [&>circle]:hidden' />
          </Button>
        }
        {...triggerProps}
      />
      <PopoverContent
        side='top'
        align='start'
        {...contentProps}
        className={cn('text-muted-foreground text-sm', contentProps?.className)}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
