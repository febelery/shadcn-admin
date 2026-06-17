import * as React from 'react'
import { z } from 'zod'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { getQiniuUptoken } from '@/api/qiniu'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Editor, type EditorVariant } from '@/components/ui/editor'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQiniuUpload } from '@/components/file-upload'

// 表单 Schema
const formSchema = z.object({
  content: z
    .string()
    .min(1, '内容不能为空')
    .refine(
      (val) => val.replace(/<[^>]*>/g, '').trim().length >= 10,
      '内容至少需要 10 个字符（不包含 HTML 标签）'
    ),
})

type FormValues = z.infer<typeof formSchema>

function EditorFormExample({
  disabled,
  handleUpload,
  variant,
}: {
  disabled: boolean
  handleUpload: (file: File) => Promise<{ src: string }>
  variant: EditorVariant
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
              <Editor
                variant={variant}
                placeholder='请输入至少 10 个字符的文章内容...'
                disabled={disabled}
                className='min-h-[300px]'
                onUpload={handleUpload}
                value={field.state.value || ''}
                onChange={field.handleChange}
              />
              <FieldDescription>
                请输入文章的正文内容，支持富文本格式。
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
              '<p>这是一段<b>默认设置</b>的回显内容，用于测试表单重置和初始化功能。</p>'
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
  const [variant, setVariant] = React.useState<EditorVariant>('standard')

  const { uploadFile } = useQiniuUpload()

  const handleUpload = React.useCallback(
    async (file: File) => {
      // QiniuConfig 直接内联构造
      const url = await uploadFile(file, {
        getToken: getQiniuUptoken,
        region: 'z2',
      })
      return { src: url }
    },
    [uploadFile]
  )

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Editor</h2>
          <p className='text-muted-foreground'>
            基于 AiEditor 的富文本编辑器组件。
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Label>工具栏模式</Label>
            <Tabs
              value={variant}
              onValueChange={(v) => setVariant(v as EditorVariant)}
            >
              <TabsList>
                <TabsTrigger value='basic'>基础 (Basic)</TabsTrigger>
                <TabsTrigger value='standard'>标准 (Standard)</TabsTrigger>
                <TabsTrigger value='full'>完整 (Full)</TabsTrigger>
              </TabsList>
            </Tabs>
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
            结合 TanStack Form 和 Zod 进行表单验证。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditorFormExample
            disabled={disabled}
            handleUpload={handleUpload}
            variant={variant}
          />
        </CardContent>
      </Card>
    </div>
  )
}
