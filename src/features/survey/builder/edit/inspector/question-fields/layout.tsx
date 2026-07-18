import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'

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
        <FieldDescription className='text-muted-foreground text-xs leading-relaxed'>
          {hint}
        </FieldDescription>
      ) : null}
    </Field>
  )
}

export function InspectorFormGroup({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className='border-border/60 bg-muted/20 flex flex-col gap-3 rounded-lg border p-3.5'>
      <div className='flex flex-col gap-0.5'>
        <p className='text-muted-foreground text-xs font-medium'>{title}</p>
        {description ? (
          <p className='text-muted-foreground text-xs leading-relaxed'>
            {description}
          </p>
        ) : null}
      </div>
      <div className='flex flex-col gap-3'>{children}</div>
    </div>
  )
}
