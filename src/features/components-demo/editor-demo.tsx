import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQiniuUpload } from '@/hooks/use-qiniu-upload'
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createDefaultQiniuConfig } from '@/components/file-upload/use-file-upload'

// 表单 Schema
const formSchema = z.object({
  content: z
    .string()
    .min(1, '内容不能为空')
    .refine((val) => {
      const text = val.replace(/<[^>]*>/g, '').trim()
      return text.length >= 10
    }, '内容至少需要 10 个字符（不包含 HTML 标签）'),
})

type FormValues = z.infer<typeof formSchema>

// 独立的表单示例组件
function EditorFormExample({
  disabled,
  handleUpload,
  variant,
}: {
  disabled: boolean
  handleUpload: (file: File) => Promise<{ src: string }>
  variant: EditorVariant
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  })

  function onSubmit(data: FormValues) {
    toast.success('验证通过', {
      description: (
        <div className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
          <p className='text-white'>提交长度: {data.content.length}</p>
        </div>
      ),
    })
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormLabel>文章内容</FormLabel>
              <FormControl>
                <Editor
                  variant={variant}
                  placeholder='请输入至少 10 个字符的文章内容...'
                  disabled={disabled}
                  className='min-h-[300px]'
                  onUpload={handleUpload}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                请输入文章的正文内容，支持富文本格式。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={disabled}
            onClick={() =>
              form.setValue(
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
    </Form>
  )
}

export default function EditorDemo() {
  const [disabled, setDisabled] = React.useState(false)
  const [variant, setVariant] = React.useState<EditorVariant>('standard')

  // 集成七牛上传
  const { uploadFile } = useQiniuUpload()

  const handleUpload = React.useCallback(
    async (file: File) => {
      const config = createDefaultQiniuConfig()
      try {
        const url = await uploadFile(file, config)
        return { src: url }
      } catch (error) {
        console.error('Upload error:', error)
        throw error
      }
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
            结合 React Hook Form 和 Zod 进行表单验证。
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
