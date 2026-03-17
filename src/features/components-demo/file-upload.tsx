/**
 * 文件上传组件交互式演示
 */
import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getQiniuUptoken } from '@/api/qiniu'
import { cn } from '@/lib/utils'
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
import { FileUpload } from '@/components/file-upload'
import type {
  FileView,
  CardSize,
  FileValidation,
  QiniuConfig,
} from '@/components/file-upload'
import { PageLayout } from '@/components/layout/page-layout'

const FILE_TYPE_OPTIONS = [
  { value: '*', label: '所有文件' },
  { value: 'image/*', label: '图片 (image/*)' },
  { value: '.jpg,.png,.gif', label: '图片 (.jpg, .png, .gif)' },
  { value: '.pdf,.doc,.docx', label: '文档 (.pdf, .doc, .docx)' },
  { value: '.zip,.rar,.7z', label: '压缩包 (.zip, .rar, .7z)' },
  { value: 'video/*', label: '视频 (video/*)' },
  { value: 'audio/*', label: '音频 (audio/*)' },
]

const FILE_SIZE_OPTIONS = [
  { value: '1', label: '1 MB' },
  { value: '5', label: '5 MB' },
  { value: '10', label: '10 MB' },
  { value: '20', label: '20 MB' },
  { value: '50', label: '50 MB' },
  { value: 'none', label: '无限制' },
]

const FILE_COUNT_OPTIONS = [
  { value: '1', label: '1 个（单文件模式）' },
  { value: '3', label: '3 个' },
  { value: '5', label: '5 个' },
  { value: '10', label: '10 个' },
  { value: 'none', label: '无限制' },
]

export function FileUploadDemo() {
  const [view, setView] = React.useState<FileView>('card')
  const [cardSize, setCardSize] = React.useState<CardSize>('lg')
  const [fileType, setFileType] = React.useState('*')
  const [maxSize, setMaxSize] = React.useState('5')
  const [maxFiles, setMaxFiles] = React.useState('3')
  const [enableCustomValidation, setEnableCustomValidation] =
    React.useState(false)
  const [enableCrop, setEnableCrop] = React.useState(false)
  const [aspect, setAspect] = React.useState<string>('free')

  const validation = React.useMemo<FileValidation>(() => {
    const rule: FileValidation = {}
    if (fileType !== '*') {
      rule.accept = fileType.includes(',') ? fileType.split(',') : fileType
    }
    if (maxSize !== 'none') rule.maxSize = Number(maxSize) * 1024 * 1024
    if (maxFiles !== 'none') rule.maxFiles = Number(maxFiles)
    if (enableCustomValidation) {
      rule.validate = (file) => {
        if (/[<>:"/\\|?*]/.test(file.name)) {
          return '文件名不能包含特殊字符: < > : " / \\ | ? *'
        }
        return null
      }
    }
    return rule
  }, [fileType, maxSize, maxFiles, enableCustomValidation])

  // 七牛上传配置
  const uploadConfig = React.useMemo<QiniuConfig>(
    () => ({ getToken: getQiniuUptoken, region: 'z2' }),
    []
  )

  const handleReset = () => {
    setView('card')
    setCardSize('lg')
    setFileType('*')
    setMaxSize('5')
    setMaxFiles('5')
    setEnableCustomValidation(false)
  }

  return (
    <PageLayout>
      <div className='mb-6'>
        <h1 className='mb-2 text-3xl font-bold'>文件上传组件演示</h1>
        <p className='text-muted-foreground'>
          通过配置面板调整验证规则，实时查看效果
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* 配置面板 */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>配置面板</CardTitle>
            <CardDescription>调整上传组件的验证规则和显示模式</CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='space-y-2'>
              <Label>视图模式</Label>
              <Select
                value={view}
                onValueChange={(v) => setView(v as FileView)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='list'>列表视图</SelectItem>
                  <SelectItem value='card'>卡片视图</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {view === 'card' && (
              <div className='space-y-2'>
                <Label>卡片尺寸</Label>
                <Select
                  value={cardSize}
                  onValueChange={(v) => setCardSize(v as CardSize)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='sm'>小 (100px)</SelectItem>
                    <SelectItem value='lg'>大 (180px)</SelectItem>
                    <SelectItem value='full'>全宽</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className='space-y-2'>
              <Label>文件类型</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>最大文件大小</Label>
              <Select value={maxSize} onValueChange={setMaxSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>最大文件数量</Label>
              <Select value={maxFiles} onValueChange={setMaxFiles}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILE_COUNT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className='pt-2'>
              <div className='mb-2 flex items-center justify-between'>
                <Label className='text-primary font-bold'>图片裁剪</Label>
              </div>
              <Select
                value={enableCrop ? 'true' : 'false'}
                onValueChange={(v) => {
                  const isEnabled = v === 'true'
                  setEnableCrop(isEnabled)
                }}
              >
                <SelectTrigger
                  className={cn(
                    'h-10 transition-all',
                    enableCrop && 'border-primary/50 ring-primary/10 ring-2'
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='false'>关闭</SelectItem>
                  <SelectItem value='true'>开启</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {enableCrop && (
              <div className='animate-in slide-in-from-top-2 space-y-2 duration-300'>
                <Label className='text-xs font-semibold'>裁剪比例预设</Label>
                <Select value={aspect} onValueChange={setAspect}>
                  <SelectTrigger className='h-9'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='free'>自由裁剪 (Free)</SelectItem>
                    <SelectItem value='1'>正方形 (1:1)</SelectItem>
                    <SelectItem value='1.7777777777777777'>
                      宽屏 (16:9)
                    </SelectItem>
                    <SelectItem value='1.3333333333333333'>
                      标准 (4:3)
                    </SelectItem>
                    <SelectItem value='0.6666666666666666'>
                      人像 (2:3)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            <div className='space-y-2'>
              <Label>自定义验证（检查文件名特殊字符）</Label>
              <Select
                value={enableCustomValidation ? 'true' : 'false'}
                onValueChange={(v) => setEnableCustomValidation(v === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='false'>关闭</SelectItem>
                  <SelectItem value='true'>开启</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 当前配置摘要 */}
            <div className='space-y-2'>
              <Label className='text-muted-foreground text-xs'>当前配置</Label>
              <div className='bg-muted/50 space-y-1 rounded-lg p-3 text-xs'>
                <div>
                  <span className='font-medium'>视图：</span>
                  {view === 'list' ? '列表' : `卡片 (${cardSize})`}
                </div>
                <div>
                  <span className='font-medium'>类型：</span>
                  {FILE_TYPE_OPTIONS.find((o) => o.value === fileType)?.label}
                </div>
                <div>
                  <span className='font-medium'>大小：</span>
                  {maxSize === 'none' ? '无限制' : `${maxSize} MB`}
                </div>
                <div>
                  <span className='font-medium'>数量：</span>
                  {maxFiles === 'none' ? '无限制' : `最多 ${maxFiles} 个`}
                </div>
                <div>
                  <span className='font-medium'>图片裁剪：</span>
                  {enableCrop
                    ? `开启 (${aspect === 'free' ? '自由' : aspect})`
                    : '关闭'}
                </div>
                <div>
                  <span className='font-medium'>自定义验证：</span>
                  {enableCustomValidation ? '已启用' : '未启用'}
                </div>
              </div>
            </div>

            <Button variant='outline' className='w-full' onClick={handleReset}>
              重置配置
            </Button>
          </CardContent>
        </Card>

        {/* 预览区域 */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>组件预览（含表单验证）</CardTitle>
            <CardDescription>使用 React Hook Form + Zod</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploadFormExample
              validation={validation}
              view={view}
              cardSize={cardSize}
              uploadConfig={uploadConfig}
              maxFiles={maxFiles !== 'none' ? Number(maxFiles) : undefined}
              crop={enableCrop}
              aspect={aspect === 'free' ? undefined : Number(aspect)}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

type FormValues = { files: string[] }

function FileUploadFormExample({
  validation,
  view = 'list',
  cardSize = 'lg',
  uploadConfig,
  maxFiles = 1,
  crop,
  aspect,
}: {
  validation?: FileValidation
  view?: FileView
  cardSize?: CardSize
  uploadConfig?: QiniuConfig
  maxFiles?: number
  crop?: boolean
  aspect?: number
}) {
  const formSchema = React.useMemo(
    () =>
      z.object({
        files: z
          .array(z.string().url('必须是有效的 URL'))
          .min(1, '请至少上传一个文件')
          .max(maxFiles, `最多只能上传 ${maxFiles} 个文件`),
      }),
    [maxFiles]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { files: [] },
  })

  const formValues = form.watch('files')

  const onSubmit = (values: FormValues) => {
    alert(
      `表单验证通过！已上传 ${values.files.length} 个文件\n\n${values.files.join('\n')}`
    )
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
                <FormLabel>上传文件</FormLabel>
                <FormControl>
                  <FileUpload
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(
                        Array.isArray(val) ? val : val ? [val] : []
                      )
                    }}
                    view={view}
                    cardSize={cardSize}
                    validation={validation}
                    upload={uploadConfig}
                    crop={crop}
                    aspect={aspect}
                    onFileAccept={(f) => console.log('接受:', f.name)}
                    onFileReject={(f, r) => console.warn('拒绝:', f.name, r)}
                    onUploadSuccess={(f, url) =>
                      console.log('成功:', f.name, url)
                    }
                    onUploadError={(f, err) =>
                      console.error('失败:', f.name, err)
                    }
                  />
                </FormControl>
                <FormDescription>支持拖拽、点击、粘贴上传</FormDescription>
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
              onClick={() => form.reset()}
            >
              重置
            </Button>
          </div>
        </form>
      </Form>

      {/* 回显测试 */}
      <div className='space-y-2'>
        <Label className='text-sm'>回显测试</Label>
        <div className='flex items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => {
              form.setValue('files', [
                'https://fastly.picsum.photos/id/85/1200/600.jpg?hmac=W2QBqi3MH6WgJqDvRPJwDLhr_pin-ZEoiSQFez6egWE',
                'https://wximg.chuanbaoguancha.cn/mkt/trim63426fb5c5cb49768048dd605a869da8-a165eec3-gs.MOV',
                'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
                'https://www.w3schools.com/html/horse.mp3',
              ])
            }}
          >
            设置回显示例
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => form.setValue('files', [])}
          >
            清空
          </Button>
        </div>
        <p className='text-muted-foreground text-xs'>
          点击「设置回显示例」测试图片 / 视频 / 音频的回显效果
        </p>
      </div>

      {/* 当前值 */}
      {formValues.length > 0 && (
        <div className='space-y-1.5'>
          <Label className='text-muted-foreground text-xs'>当前 URL 值</Label>
          <ul className='bg-muted/50 space-y-1 rounded-lg p-3 font-mono text-xs break-all'>
            {formValues.map((url, i) => (
              <li key={i} className='text-muted-foreground'>
                <span className='text-foreground font-medium'>{i + 1}.</span>{' '}
                {url}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
