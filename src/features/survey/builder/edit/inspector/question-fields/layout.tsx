import { cn } from 'cn'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** 低价值说明文字统一收进 info 浮层,避免单独占一段 */
export function InfoHint({
  label,
  className,
  side = 'left',
}: {
  label: string
  className?: string
  side?: 'left' | 'top' | 'bottom'
}) {
  return (
    <Tooltip delay={200}>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon-xs'
            className={cn(
              'text-muted-foreground/60 hover:text-foreground focus-visible:text-foreground size-5 shrink-0 rounded-full hover:bg-transparent',
              className
            )}
            aria-label={label}
          />
        }
      >
        <Info className='size-3.5' />
      </TooltipTrigger>
      <TooltipContent side={side} className='max-w-52 leading-relaxed'>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export function InspectorFormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <Field className='gap-1.5'>
      <FieldLabel
        htmlFor={htmlFor}
        className='text-muted-foreground text-xs font-medium'
      >
        {label}
      </FieldLabel>
      {children}
      {hint ? (
        <FieldDescription className='text-muted-foreground/70 text-xs leading-relaxed'>
          {hint}
        </FieldDescription>
      ) : null}
    </Field>
  )
}

/** 卡片内的二级分组:比外层区块更紧,靠底色而非线条区分 */
export function InspectorFormGroup({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className='border-border/60 bg-muted/40 flex flex-col gap-3 rounded-lg border p-3'>
      <div className='flex items-center gap-1.5'>
        <p className='text-foreground/75 text-xs font-semibold'>{title}</p>
        {hint ? <InfoHint label={hint} side='top' /> : null}
      </div>
      <div className='flex flex-col gap-3'>{children}</div>
    </div>
  )
}
