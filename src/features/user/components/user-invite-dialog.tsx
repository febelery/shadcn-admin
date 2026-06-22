import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { MailPlus, Send } from 'lucide-react'
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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles } from '../data/data'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? '请输入要邀请的邮箱。' : undefined),
  }),
  role: z.string().min(1, '角色是必填项。'),
  desc: z.string().optional(),
})

type UserInviteForm = z.infer<typeof formSchema>

type UserInviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const form = useForm({
    defaultValues: {
      email: '',
      role: '',
      desc: '',
    } as UserInviteForm,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      form.reset()
      showSubmittedData(value)
      onOpenChange(false)
    },
  })

  // 弹窗打开时重置表单
  useEffect(() => {
    if (open) form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <MailPlus /> 邀请用户
          </DialogTitle>
          <DialogDescription>
            通过发送电子邮件邀请新用户加入您的团队。分配角色以定义他们的访问级别。
          </DialogDescription>
        </DialogHeader>
        <form
          id='user-invite-form'
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className='space-y-4'
        >
          {/* 邮箱 */}
          <form.Field
            name='email'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>邮箱</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type='email'
                    placeholder='例如：john.doe@gmail.com'
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* 角色 */}
          <form.Field
            name='role'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>角色</FieldLabel>
                  <SelectDropdown
                    defaultValue={field.state.value}
                    onValueChange={field.handleChange}
                    placeholder='选择角色'
                    items={roles.map(({ label, value }) => ({
                      label,
                      value,
                    }))}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* 描述 */}
          <form.Field
            name='desc'
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>描述（可选）</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    className='resize-none'
                    placeholder='为您的邀请添加个人备注（可选）'
                    value={field.state.value || ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>取消</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form'>
            邀请 <Send />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
