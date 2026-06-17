import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

// 校验 FileList 实例是否非空且为 CSV 格式
const formSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, {
      message: '请上传文件',
    })
    .refine(
      (files) => ['text/csv'].includes(files?.[0]?.type),
      '请上传 CSV 格式文件。'
    ),
})

type TaskImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskImportDialog({
  open,
  onOpenChange,
}: TaskImportDialogProps) {
  const form = useForm({
    defaultValues: {
      file: undefined as unknown as FileList,
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      const file = value.file
      if (file && file[0]) {
        const fileDetails = {
          name: file[0].name,
          size: file[0].size,
          type: file[0].type,
        }
        showSubmittedData(fileDetails, 'You have imported the following file:')
      }
      onOpenChange(false)
    },
  })

  // 当弹窗状态改变时重置表单
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        form.reset()
      }}
    >
      <DialogContent className='gap-2 sm:max-w-sm'>
        <DialogHeader className='text-start'>
          <DialogTitle>导入任务</DialogTitle>
          <DialogDescription>从 CSV 文件快速导入任务。</DialogDescription>
        </DialogHeader>
        <form
          id='task-import-form'
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name='file'
            children={(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid} className='my-2'>
                  <FieldLabel htmlFor={field.name}>文件</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type='file'
                    className='h-8 py-0'
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      if (e.target.files) {
                        field.handleChange(e.target.files)
                      }
                    }}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </form>
        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline'>关闭</Button>
          </DialogClose>
          <Button type='submit' form='task-import-form'>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
