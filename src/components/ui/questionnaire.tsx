import type React from 'react'
import { Questionnaire as Primitive } from '@shadcn/react/questionnaire'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export const Questionnaire = Primitive.Root
export const QuestionnaireProgress = Primitive.Progress
export const QuestionnaireItem = ({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) => (
  <Primitive.Item className={cn('[&[hidden]]:hidden', className)} {...props} />
)
export const QuestionnaireTitle = Primitive.Title
export const QuestionnaireDescription = Primitive.Description
export const QuestionnaireChoices = Primitive.Choices
export const QuestionnaireChoice = ({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Choice>) => (
  <Primitive.Choice
    className={cn(
      'hover:bg-accent/50 focus-within:ring-ring flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
      'data-[checked]:border-primary data-[checked]:bg-accent/50 data-[checked]:font-medium',
      'focus-within:ring-ring/50 focus-within:ring-2 focus-within:outline-none',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  >
    <Primitive.ChoiceInput className='sr-only' />
    <Primitive.ChoiceLabel className='flex flex-1 flex-col gap-0.5'>
      {children}
    </Primitive.ChoiceLabel>
    <Primitive.ChoiceShortcut className='border-muted-foreground/30 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-xs font-normal [&[hidden]]:hidden' />
  </Primitive.Choice>
)
export const QuestionnaireChoiceInput = Primitive.ChoiceInput
export const QuestionnaireChoiceLabel = Primitive.ChoiceLabel
export const QuestionnaireChoiceShortcut = Primitive.ChoiceShortcut
export const QuestionnaireInput = ({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Input>) => (
  <Primitive.Input
    className={cn(
      'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
)
export const QuestionnaireError = ({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Error>) => (
  <Primitive.Error
    className={cn(
      'text-destructive mt-2 text-xs font-medium [&[hidden]]:hidden',
      className
    )}
    {...props}
  />
)
export const QuestionnairePrevious = ({
  className,
  variant = 'outline',
  size = 'sm',
  ...props
}: React.ComponentProps<typeof Primitive.Previous> &
  VariantProps<typeof buttonVariants>) => (
  <Primitive.Previous
    className={cn(
      buttonVariants({ variant, size }),
      '[&[hidden]]:hidden',
      className
    )}
    {...props}
  />
)
export const QuestionnaireSkip = ({
  className,
  variant = 'ghost',
  size = 'sm',
  ...props
}: React.ComponentProps<typeof Primitive.Skip> &
  VariantProps<typeof buttonVariants>) => (
  <Primitive.Skip
    className={cn(
      buttonVariants({ variant, size }),
      '[&[hidden]]:hidden',
      className
    )}
    {...props}
  />
)
export const QuestionnaireNext = ({
  className,
  variant = 'default',
  size = 'sm',
  ...props
}: React.ComponentProps<typeof Primitive.Next> &
  VariantProps<typeof buttonVariants>) => (
  <Primitive.Next
    className={cn(
      buttonVariants({ variant, size }),
      '[&[hidden]]:hidden',
      className
    )}
    {...props}
  />
)
export const QuestionnaireSubmit = ({
  className,
  variant = 'default',
  size = 'sm',
  ...props
}: React.ComponentProps<typeof Primitive.Submit> &
  VariantProps<typeof buttonVariants>) => (
  <Primitive.Submit
    className={cn(
      buttonVariants({ variant, size }),
      '[&[hidden]]:hidden',
      className
    )}
    {...props}
  />
)
export const QuestionnaireActions = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-between gap-2', className)}
    {...props}
  />
)
