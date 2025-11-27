/**
 * 文件上传组件交互式演示
 */
import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type {
  FileUploadView,
  FileUploadCardSize,
  FileUploadValidationRule,
} from '@/types/file-upload'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { FileUpload as FileUploadComponent } from '@/components/file-upload'
import { createDefaultQiniuConfig } from '@/components/file-upload/use-file-upload'
import { PageLayout } from '@/components/layout/page-layout'

// 文件类型选项
const FILE_TYPE_OPTIONS = [
  { value: '*', label: '所有文件' },
  { value: 'image/*', label: '图片 (image/*)' },
  { value: '.jpg,.png,.gif', label: '图片 (.jpg, .png, .gif)' },
  { value: '.pdf,.doc,.docx', label: '文档 (.pdf, .doc, .docx)' },
  { value: '.zip,.rar,.7z', label: '压缩包 (.zip, .rar, .7z)' },
  { value: 'video/*', label: '视频 (video/*)' },
  { value: 'audio/*', label: '音频 (audio/*)' },
]

// 文件大小选项（MB）
const FILE_SIZE_OPTIONS = [
  { value: '1', label: '1 MB' },
  { value: '5', label: '5 MB' },
  { value: '10', label: '10 MB' },
  { value: '20', label: '20 MB' },
  { value: '50', label: '50 MB' },
  { value: '100', label: '100 MB' },
  { value: 'none', label: '无限制' },
]

// 文件数量选项
const FILE_COUNT_OPTIONS = [
  { value: '1', label: '1 个' },
  { value: '3', label: '3 个' },
  { value: '5', label: '5 个' },
  { value: '10', label: '10 个' },
  { value: '20', label: '20 个' },
  { value: 'none', label: '无限制' },
]

export function FileUploadDemo() {
  // 视图模式
  const [view, setView] = React.useState<FileUploadView>('card')
  // 卡片尺寸
  const [cardSize, setCardSize] = React.useState<FileUploadCardSize>('lg')
  // 文件类型
  const [fileType, setFileType] = React.useState('*')
  // 文件大小限制（MB）
  const [maxSize, setMaxSize] = React.useState('5')
  // 文件数量限制（1 表示单文件模式，其他表示多文件模式）
  const [maxFiles, setMaxFiles] = React.useState('3')
  // 是否启用自定义验证
  const [enableCustomValidation, setEnableCustomValidation] =
    React.useState(false)

  // 构建验证规则
  const validation = React.useMemo<FileUploadValidationRule>(() => {
    const rule: FileUploadValidationRule = {}

    // 文件类型
    if (fileType !== '*') {
      rule.accept = fileType.includes(',') ? fileType.split(',') : fileType
    }

    // 文件大小
    if (maxSize !== 'none') {
      rule.maxSize = Number(maxSize) * 1024 * 1024
    }

    // 文件数量
    if (maxFiles !== 'none') {
      rule.maxFiles = Number(maxFiles)
    }

    // 自定义验证
    if (enableCustomValidation) {
      rule.validate = (file) => {
        // 检查文件名不能包含特殊字符
        if (/[<>:"/\\|?*]/.test(file.name)) {
          return '文件名不能包含特殊字符: < > : " / \\ | ? *'
        }
        // 检查文件大小（如果设置了限制）
        if (maxSize !== 'none' && file.size > Number(maxSize) * 1024 * 1024) {
          return `文件大小不能超过 ${maxSize}MB`
        }
        return null
      }
    }

    return rule
  }, [fileType, maxSize, maxFiles, enableCustomValidation])

  // 使用默认的七牛上传配置（自动使用统一的 API）
  const uploadConfig = React.useMemo(
    () => createDefaultQiniuConfig('your-qiniu-domain.com'),
    []
  )

  return (
    <PageLayout>
      <div className='mb-6'>
        <h1 className='mb-2 text-3xl font-bold'>文件上传组件交互式演示</h1>
        <p className='text-muted-foreground'>
          通过下方配置面板调整验证规则，实时查看效果
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* 配置面板 */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>配置面板</CardTitle>
            <CardDescription>调整上传组件的验证规则和显示模式</CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* 视图模式 */}
            <div className='space-y-2'>
              <Label htmlFor='view'>视图模式</Label>
              <Select
                value={view}
                onValueChange={(v) => setView(v as FileUploadView)}
              >
                <SelectTrigger id='view'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='list'>列表视图</SelectItem>
                  <SelectItem value='card'>卡片视图</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 卡片尺寸（仅在卡片视图时显示） */}
            {view === 'card' && (
              <div className='space-y-2'>
                <Label htmlFor='cardSize'>卡片尺寸</Label>
                <Select
                  value={cardSize}
                  onValueChange={(v) => setCardSize(v as FileUploadCardSize)}
                >
                  <SelectTrigger id='cardSize'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='sm'>小 (120px)</SelectItem>
                    <SelectItem value='lg'>大 (200px)</SelectItem>
                    <SelectItem value='full'>全宽</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* 文件类型 */}
            <div className='space-y-2'>
              <Label htmlFor='fileType'>文件类型限制</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger id='fileType'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 文件大小 */}
            <div className='space-y-2'>
              <Label htmlFor='maxSize'>最大文件大小</Label>
              <Select value={maxSize} onValueChange={setMaxSize}>
                <SelectTrigger id='maxSize'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 文件数量 */}
            <div className='space-y-2'>
              <Label htmlFor='maxFiles'>最大文件数量（1 = 单文件模式）</Label>
              <Select value={maxFiles} onValueChange={setMaxFiles}>
                <SelectTrigger id='maxFiles'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_COUNT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 自定义验证 */}
            <div className='space-y-2'>
              <Label htmlFor='customValidation'>自定义验证</Label>
              <Select
                value={enableCustomValidation ? 'true' : 'false'}
                onValueChange={(v) => setEnableCustomValidation(v === 'true')}
              >
                <SelectTrigger id='customValidation'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='false'>关闭</SelectItem>
                  <SelectItem value='true'>
                    开启（检查文件名特殊字符）
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 当前配置摘要 */}
            <div className='space-y-2'>
              <Label>当前配置</Label>
              <div className='bg-muted space-y-1 rounded-md p-3 text-xs'>
                <div>
                  <span className='font-medium'>视图:</span>{' '}
                  {view === 'list' ? '列表' : `卡片 (${cardSize})`}
                </div>
                <div>
                  <span className='font-medium'>类型:</span>{' '}
                  {FILE_TYPE_OPTIONS.find((o) => o.value === fileType)?.label ||
                    fileType}
                </div>
                <div>
                  <span className='font-medium'>大小:</span>{' '}
                  {maxSize === 'none' ? '无限制' : `${maxSize} MB`}
                </div>
                <div>
                  <span className='font-medium'>数量:</span>{' '}
                  {maxFiles === 'none' ? '无限制' : `最多 ${maxFiles} 个`}
                </div>
                <div>
                  <span className='font-medium'>自定义验证:</span>{' '}
                  {enableCustomValidation ? '已启用' : '未启用'}
                </div>
              </div>
            </div>

            {/* 重置按钮 */}
            <Button
              variant='outline'
              className='w-full'
              onClick={() => {
                setView('list')
                setCardSize('lg')
                setFileType('image/*')
                setMaxSize('5')
                setMaxFiles('5')
                setEnableCustomValidation(false)
              }}
            >
              重置配置
            </Button>
          </CardContent>
        </Card>

        {/* 预览区域 */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>组件预览（含表单验证）</CardTitle>
            <CardDescription>
              使用 React Hook Form + Zod 进行表单验证
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadFormExample
              validation={validation}
              view={view}
              cardSize={cardSize}
              uploadConfig={uploadConfig}
              maxFiles={maxFiles !== 'none' ? Number(maxFiles) : undefined}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

// 表单验证示例组件
// 注意：FileUpload 组件返回的是 URL 字符串数组，而不是 File 对象
// 文件大小和类型验证在 FileUpload 组件的 validation prop 中完成
type FormValues = {
  files: string[]
}

interface FileUploadFormExampleProps {
  validation?: FileUploadValidationRule
  view?: FileUploadView
  cardSize?: FileUploadCardSize
  uploadConfig?: {
    getToken: (file: File) => Promise<string>
    domain: string
  }
  maxFiles?: number
}

function FileUploadFormExample({
  validation,
  view = 'list',
  cardSize = 'lg',
  uploadConfig,
  maxFiles = 1,
}: FileUploadFormExampleProps) {
  // 动态生成表单验证 schema，使用传入的 maxFiles
  const formSchema = React.useMemo(
    () =>
      z.object({
        files: z
          .array(z.string().url('必须是有效的 URL'))
          .min(1, '请至少选择一个文件')
          .max(maxFiles, `最多只能选择 ${maxFiles} 个文件`),
      }),
    [maxFiles]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const formValues = form.watch('files')

  const onSubmit = (values: FormValues) => {
    console.log('表单提交:', values)
    alert(`表单验证通过！已选择 ${values.files.length} 个文件`)
  }

  return (
    <div className='space-y-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='files'
            render={({ field }) => (
              <FormItem>
                <FormLabel>文件上传</FormLabel>
                <FormControl>
                  <FileUploadComponent
                    value={field.value}
                    onChange={(val) => {
                      const files = Array.isArray(val) ? val : val ? [val] : []
                      field.onChange(files)
                    }}
                    view={view}
                    cardSize={cardSize}
                    validation={validation}
                    upload={uploadConfig}
                    onFileAccept={(file) => {
                      console.log('文件已接受:', file.name)
                    }}
                    onFileReject={(file, reason) => {
                      console.warn('文件被拒绝:', file.name, reason)
                    }}
                    onUploadSuccess={(file, url) => {
                      console.log('上传成功:', file.name, url)
                    }}
                    onUploadError={(file, error) => {
                      console.error('上传失败:', file.name, error)
                    }}
                  />
                </FormControl>
                <FormDescription>表单验证测试上传</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex items-center gap-2'>
            <Button type='submit' size='sm'>
              提交表单
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => {
                form.reset()
              }}
            >
              重置
            </Button>
          </div>
        </form>
      </Form>

      {/* 回显功能测试 */}
      <div className='space-y-2'>
        <Label>回显功能测试:</Label>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              const exampleUrls = [
                'https://fastly.picsum.photos/id/85/1200/600.jpg?hmac=W2QBqi3MH6WgJqDvRPJwDLhr_pin-ZEoiSQFez6egWE',
                'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
                'https://www.w3schools.com/html/horse.mp3',
              ]
              form.setValue('files', exampleUrls)
            }}
          >
            设置回显
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              form.setValue('files', [])
            }}
          >
            清空回显
          </Button>
        </div>
        <p className='text-muted-foreground text-xs'>
          点击"设置回显"可以测试回显功能，组件会自动显示已上传的文件（支持图片和视频预览）
        </p>
      </div>

      {/* 显示当前值 */}
      {formValues.length > 0 && (
        <div className='space-y-2'>
          <Label>当前值（URL）:</Label>
          <div className='bg-muted rounded-md p-3 font-mono text-xs break-all'>
            <ul className='list-inside list-disc space-y-1'>
              {formValues.map((url, index) => (
                <li key={index}>{url}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
