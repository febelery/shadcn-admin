import * as React from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// 表单 Schema，修改验证逻辑，取消富文本 HTML 标签的过滤
const formSchema = z.object({
  content: z
    .string()
    .min(1, '内容不能为空')
    .min(10, '内容至少需要 10 个字符'),
})

type FormValues = z.infer<typeof formSchema>

function EditorFormExample({
  disabled,
}: {
  disabled: boolean
}) {
  const form = useForm({
    defaultValues: {
      content: '',
    } as FormValues,
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.success('验证通过', {
        description: (
          <div className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
            <p className='text-white'>提交长度: {value.content.length}</p>
          </div>
        ),
      })
      console.log(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className='space-y-6'
    >
      <form.Field
        name='content'
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>文章内容</FieldLabel>
              {/* 将原本的 Editor 富文本编辑器改为普通的 Textarea 组件 */}
              <Textarea
                placeholder='请输入至少 10 个字符的文章内容...'
                disabled={disabled}
                className='min-h-[300px]'
                value={field.state.value || ''}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <FieldDescription>
                请输入文章的正文内容。
              </FieldDescription>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          onClick={() =>
            form.setFieldValue(
              'content',
              '这是一段默认设置的回显内容，用于测试表单重置和初始化功能。'
            )
          }
        >
          设置回显
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          onClick={() => form.reset()}
        >
          重置表单
        </Button>
        <Button type='submit' disabled={disabled}>
          提交表单
        </Button>
      </div>
    </form>
  )
}

export default function EditorDemo() {
  const [disabled, setDisabled] = React.useState(false)

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Textarea</h2>
          <p className='text-muted-foreground'>
            基础的多行文本输入框组件。
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Switch
              checked={disabled}
              onCheckedChange={setDisabled}
              id='disable-mode'
            />
            <Label htmlFor='disable-mode'>禁用编辑</Label>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>表单验证集成</CardTitle>
          <CardDescription>
            结合 TanStack Form 和 Zod 进行表单验证。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditorFormExample
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </div>
  )
}

