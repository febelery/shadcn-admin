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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Editor, zEditorString } from '@/components/editor'

// 表单 Schema，使用富文本专属的 zEditorString 轻松在内部剥离 HTML 标签进行字数验证
const formSchema = z.object({
  content: zEditorString({
    min: 10,
    minError: '内容至少需要 10 个字符',
    requiredError: '内容不能为空',
  }),
})

type FormValues = z.infer<typeof formSchema>

function EditorFormExample({
  disabled,
  toolbar,
}: {
  disabled: boolean
  toolbar: 'full' | 'compact' | 'hidden'
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
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>文章内容</FieldLabel>
              <Editor
                id={field.name}
                placeholder='请输入至少 10 个字符的文章内容...'
                disabled={disabled}
                invalid={isInvalid}
                value={field.state.value || ''}
                onChange={(val) => field.handleChange(val)}
                onBlur={() => field.handleBlur()}
                toolbar={toolbar}
              />
              <FieldDescription>请输入文章的正文内容。</FieldDescription>
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

const toolbarModes = [
  { value: 'full' as const, label: '完整', desc: '全部格式与功能' },
  { value: 'compact' as const, label: '精简', desc: '基础格式' },
  { value: 'hidden' as const, label: '隐藏', desc: '纯编辑区' },
]

export default function EditorDemo() {
  const [disabled, setDisabled] = React.useState(false)
  const [toolbar, setToolbar] = React.useState<'full' | 'compact' | 'hidden'>(
    'full'
  )

  return (
    <div className='space-y-6 p-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Tiptap 富文本编辑器
          </h2>
          <p className='text-muted-foreground'>
            基于 Tiptap
            封装的模块化富文本编辑器，集成常用文本排版、超链接、图片上传及字数/字符统计。
          </p>
        </div>
        <div className='flex items-center gap-6'>
          <div className='flex items-center gap-2'>
            <Label className='text-muted-foreground text-xs'>工具栏</Label>
            <div className='flex rounded-md border p-0.5'>
              {toolbarModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant={toolbar === mode.value ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setToolbar(mode.value)}
                  className='h-7 text-xs'
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>
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
            结合 TanStack Form 和 Zod 进行表单验证。当前工具栏模式：
            {toolbarModes.find((m) => m.value === toolbar)?.desc}。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditorFormExample disabled={disabled} toolbar={toolbar} />
        </CardContent>
      </Card>
    </div>
  )
}
