import { z } from 'zod'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'

const items = [
  {
    id: 'recents',
    label: 'Recents',
  },
  {
    id: 'home',
    label: 'Home',
  },
  {
    id: 'applications',
    label: 'Applications',
  },
  {
    id: 'desktop',
    label: 'Desktop',
  },
  {
    id: 'downloads',
    label: 'Downloads',
  },
  {
    id: 'documents',
    label: 'Documents',
  },
] as const

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

export function DisplayForm() {
  const form = useForm({
    defaultValues: {
      items: ['recents', 'home'],
    } as DisplayFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: displayFormSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmittedData(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className='flex flex-col gap-8'
    >
      <form.Field
        name='items'
        children={(field) => {
          const isInvalid =
            field.state.meta.errors.length > 0 &&
            (field.state.meta.isTouched || form.state.submissionAttempts > 0)
          return (
            <FieldSet>
              <div>
                <FieldLegend variant='label'>Sidebar</FieldLegend>
                <FieldDescription>
                  Select the items you want to display in the sidebar.
                </FieldDescription>
              </div>

              <FieldGroup data-slot='checkbox-group'>
                {items.map((item) => (
                  <Field
                    key={item.id}
                    orientation='horizontal'
                    data-invalid={isInvalid}
                  >
                    <Checkbox
                      id={`display-item-${item.id}`}
                      checked={field.state.value?.includes(item.id)}
                      onCheckedChange={(checked) => {
                        const currentValues = field.state.value || []
                        if (checked) {
                          field.handleChange([...currentValues, item.id])
                        } else {
                          field.handleChange(
                            currentValues.filter((val) => val !== item.id)
                          )
                        }
                      }}
                    />
                    <FieldLabel
                      htmlFor={`display-item-${item.id}`}
                      className='cursor-pointer font-normal'
                    >
                      {item.label}
                    </FieldLabel>
                  </Field>
                ))}
              </FieldGroup>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </FieldSet>
          )
        }}
      />

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <Button type='submit' disabled={isSubmitting}>
            Update display
          </Button>
        )}
      />
    </form>
  )
}
