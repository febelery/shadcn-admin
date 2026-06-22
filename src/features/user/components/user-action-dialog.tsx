'use client'

import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles } from '../data/data'
import { type User } from '../data/schema'

const formSchema = z
  .object({
    firstName: z.string().min(1, '名字是必填项。'),
    lastName: z.string().min(1, '姓氏是必填项。'),
    username: z.string().min(1, '用户名是必填项。'),
    phoneNumber: z.string().min(10, '电话号码是必填项。'),
    email: z.email({
      error: (iss) => (iss.input === '' ? '邮箱是必填项。' : undefined),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, '角色是必填项。'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: '密码是必填项。',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: '密码长度至少为 8 个字符。',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: '密码必须包含至少一个小写字母。',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: '密码必须包含至少一个数字。',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: '密码不匹配。',
      path: ['confirmPassword'],
    }
  )

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow

  // 编辑时从 currentRow 展开已有字段，新建时使用空值
  const initialValues = useMemo<UserForm>(
    () =>
      isEdit
        ? { ...currentRow, password: '', confirmPassword: '', isEdit }
        : {
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            role: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            isEdit,
          },
    [currentRow, isEdit]
  )

  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      form.reset()
      showSubmittedData(value)
      onOpenChange(false)
    },
  })

  // 弹窗打开或当前行变化时，将表单重置为最新默认值
  useEffect(() => {
    if (open) form.reset()
  }, [open, initialValues])

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑用户' : '添加新用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '在此更新用户信息。' : '在此创建新用户。'}
            完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <form
            id='user-form'
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className='space-y-4 px-0.5'
          >
            {/* 名字 */}
            <form.Field
              name='firstName'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      名字
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='John'
                      className='col-span-4'
                      autoComplete='off'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 姓氏 */}
            <form.Field
              name='lastName'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      姓氏
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='Doe'
                      className='col-span-4'
                      autoComplete='off'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 用户名 */}
            <form.Field
              name='username'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      用户名
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='john_doe'
                      className='col-span-4'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 邮箱 */}
            <form.Field
              name='email'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      邮箱
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='john.doe@gmail.com'
                      className='col-span-4'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 电话号码 */}
            <form.Field
              name='phoneNumber'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      电话号码
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder='+123456789'
                      className='col-span-4'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
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
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      角色
                    </FieldLabel>
                    <SelectDropdown
                      defaultValue={field.state.value}
                      onValueChange={field.handleChange}
                      placeholder='选择角色'
                      className='col-span-4'
                      items={roles.map(({ label, value }) => ({
                        label,
                        value,
                      }))}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 密码 */}
            <form.Field
              name='password'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      密码
                    </FieldLabel>
                    <PasswordInput
                      id={field.name}
                      name={field.name}
                      placeholder='e.g., S3cur3P@ssw0rd'
                      className='col-span-4'
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />

            {/* 确认密码 */}
            <form.Field
              name='confirmPassword'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field
                    orientation='horizontal'
                    data-invalid={isInvalid}
                    className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'
                  >
                    <FieldLabel
                      htmlFor={field.name}
                      className='col-span-2 w-full justify-end text-end'
                    >
                      确认密码
                    </FieldLabel>
                    <form.Subscribe
                      selector={(state) => !!state.fieldMeta.password?.isDirty}
                      children={(isPasswordDirty) => (
                        <PasswordInput
                          id={field.name}
                          name={field.name}
                          disabled={!isPasswordDirty}
                          placeholder='e.g., S3cur3P@ssw0rd'
                          className='col-span-4'
                          value={field.state.value || ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
                      )}
                    />
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors}
                        className='col-span-4 col-start-3 text-start'
                      />
                    )}
                  </Field>
                )
              }}
            />
          </form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            保存更改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
