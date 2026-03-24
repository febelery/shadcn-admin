import { cn } from '@/lib/utils'
import * as ColorPicker from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FileUpload } from '@/components/file-upload'
import { useBuilderStore } from '@/features/survey-builder/state'
import { SubmissionRules } from '../components/submission-rules'

export function SurveySettingsPanel() {
  const meta = useBuilderStore((s) => s.meta)
  const updateMeta = useBuilderStore((s) => s.updateMeta)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div className='scrollbar-thin flex-1 overflow-y-auto pb-6'>
        <div className='divide-border/40 divide-y'>
          {/* Render mode */}
          <div className='p-3'>
            <p className='text-muted-foreground/80 mb-2 text-[10px] font-semibold tracking-wider uppercase'>
              展示模式
            </p>
            <ToggleGroup
              type='single'
              value={meta.mode}
              onValueChange={(v) => {
                if (v) updateMeta({ mode: v as 'scroll' | 'card' })
              }}
              className='bg-muted/50 grid h-auto grid-cols-2 gap-1 rounded-md p-1'
            >
              {(['scroll', 'card'] as const).map((m) => (
                <ToggleGroupItem
                  key={m}
                  value={m}
                  className='data-[state=on]:bg-background flex h-auto flex-col gap-2 p-3 data-[state=on]:shadow-sm'
                >
                  <div
                    className={cn(
                      'bg-background flex h-6 w-9 flex-col items-stretch justify-center gap-0.5 rounded border p-1',
                      meta.mode === m ? 'border-primary/20' : 'border-border/50'
                    )}
                  >
                    {m === 'scroll' ? (
                      <>
                        <div className='bg-foreground/60 h-0.5 rounded-full' />
                        <div className='bg-foreground/60 h-0.5 rounded-full' />
                        <div className='bg-primary/30 h-0.5 w-3/5 rounded-full' />
                      </>
                    ) : (
                      <div className='border-primary/20 bg-primary/5 m-auto h-3 w-6 rounded-sm border border-dashed' />
                    )}
                  </div>
                  <div className='flex flex-col items-center gap-0.5'>
                    <span className='text-[11px] font-bold'>
                      {m === 'scroll' ? '滚动' : '卡片'}
                    </span>
                    <span className='text-muted-foreground/60 text-[9px] leading-tight font-normal'>
                      {m === 'scroll' ? '纵向连贯展示' : '逐题分页切屏'}
                    </span>
                  </div>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {meta.mode === 'card' && (
              <div className='mt-3 space-y-2'>
                <div>
                  <Label className='text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-wide uppercase'>
                    过渡动画
                  </Label>
                  <Select
                    value={meta.cardConfig.transition}
                    onValueChange={(v) =>
                      updateMeta({
                        cardConfig: {
                          ...meta.cardConfig,
                          transition: v as any,
                        },
                      })
                    }
                  >
                    <SelectTrigger className='h-7 text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='slide'>滑动（左右）</SelectItem>
                      <SelectItem value='fade'>淡入淡出</SelectItem>
                      <SelectItem value='flip'>上下翻页</SelectItem>
                      <SelectItem value='none'>无动画</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className='text-muted-foreground mb-1.5 block text-[10px] font-semibold tracking-wide uppercase'>
                    进度指示器
                  </Label>
                  <ToggleGroup
                    type='single'
                    value={meta.cardConfig.progressType}
                    onValueChange={(v) => {
                      if (v) {
                        updateMeta({
                          cardConfig: {
                            ...meta.cardConfig,
                            progressType: v as any,
                          },
                        })
                      }
                    }}
                    className='grid grid-cols-3 gap-1.5'
                  >
                    {(['dots', 'bar', 'fraction'] as const).map((pt) => (
                      <ToggleGroupItem
                        key={pt}
                        value={pt}
                        variant='outline'
                        className='flex h-auto flex-col items-center gap-1 p-1.5 text-[10px] data-[state=on]:font-semibold'
                      >
                        <span>
                          {pt === 'dots' ? '●●○' : pt === 'bar' ? '▬▬' : '2/4'}
                        </span>
                        <span>
                          {pt === 'dots'
                            ? '圆点'
                            : pt === 'bar'
                              ? '进度条'
                              : '分数'}
                        </span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs'>允许返回上一题</span>
                  <Switch
                    checked={meta.cardConfig.allowBack}
                    onCheckedChange={(v) =>
                      updateMeta({
                        cardConfig: { ...meta.cardConfig, allowBack: v },
                      })
                    }
                    className='scale-[0.8]'
                  />
                </div>
              </div>
            )}
          </div>

          {/* Basic info */}
          <div className='space-y-4 p-3'>
            <p className='text-muted-foreground/80 mb-2 text-[10px] font-semibold tracking-wider uppercase'>
              基本信息
            </p>
            <div>
              <Label className='text-muted-foreground mb-1.5 block text-[11px] font-medium'>
                封面显示
              </Label>
              <ToggleGroup
                type='single'
                value={meta.coverType}
                onValueChange={(v) => {
                  if (v) updateMeta({ coverType: v as 'color' | 'image' })
                }}
                className='bg-muted/50 grid h-7 w-full grid-cols-2 rounded-md p-0.5'
              >
                <ToggleGroupItem
                  value='color'
                  className='data-[state=on]:bg-background h-6 text-[10px] data-[state=on]:shadow-sm'
                >
                  颜色
                </ToggleGroupItem>
                <ToggleGroupItem
                  value='image'
                  className='data-[state=on]:bg-background h-6 text-[10px] data-[state=on]:shadow-sm'
                >
                  图片
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {meta.coverType === 'color' ? (
              <div>
                <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                  背景颜色
                </Label>
                <ColorPicker.Root
                  value={meta.coverColor || '#000000'}
                  onValueChange={(v: string) => updateMeta({ coverColor: v })}
                >
                  <ColorPicker.Trigger
                    variant='outline'
                    className='border-input h-7 w-full justify-start bg-transparent px-2 font-normal'
                  >
                    <ColorPicker.Swatch className='mr-2 h-4 w-4 rounded-sm border' />
                    <span className='font-mono text-[10px] opacity-70'>
                      {meta.coverColor}
                    </span>
                  </ColorPicker.Trigger>
                  <ColorPicker.Content className='w-64'>
                    <ColorPicker.Area />
                    <div className='p-3 pt-0'>
                      <ColorPicker.HueSlider />
                      <ColorPicker.Input className='mt-3' />
                    </div>
                  </ColorPicker.Content>
                </ColorPicker.Root>
              </div>
            ) : (
              <div>
                <Label className='text-muted-foreground mb-1.5 block text-[11px] font-medium'>
                  封面图片
                </Label>
                <FileUpload
                  value={meta.cover ? [meta.cover] : []}
                  onChange={(urls) => {
                    const url = Array.isArray(urls) ? urls[0] : urls
                    updateMeta({ cover: (url as string) || undefined })
                  }}
                  view='card'
                  cardSize='sm'
                  variant='minimal'
                  validation={{
                    accept: ['image/*'],
                    maxSize: 2 * 1024 * 1024,
                    maxFiles: 1,
                  }}
                  crop={true}
                  aspect={16 / 9}
                />
              </div>
            )}

            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                字体颜色
              </Label>
              <ColorPicker.Root
                value={meta.fontColor || '#ffffff'}
                onValueChange={(v: string) => updateMeta({ fontColor: v })}
              >
                <ColorPicker.Trigger
                  variant='outline'
                  className='border-input h-7 w-full justify-start bg-transparent px-2 font-normal'
                >
                  <ColorPicker.Swatch className='mr-2 h-4 w-4 rounded-sm border' />
                  <span className='font-mono text-[10px] opacity-70'>
                    {meta.fontColor}
                  </span>
                </ColorPicker.Trigger>
                <ColorPicker.Content className='w-64'>
                  <ColorPicker.Area />
                  <div className='p-3 pt-0'>
                    <ColorPicker.HueSlider />
                    <ColorPicker.Input className='mt-3' />
                  </div>
                </ColorPicker.Content>
              </ColorPicker.Root>
            </div>

            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                问卷标题
              </Label>
              <Input
                className='bg-muted/40 hover:bg-muted/60 focus-visible:border-border focus-visible:bg-background h-7 border-transparent px-2 text-xs shadow-none transition-colors'
                value={meta.title}
                onChange={(e) => updateMeta({ title: e.target.value })}
              />
            </div>
            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                问卷描述
              </Label>
              <Textarea
                rows={2}
                className='bg-muted/40 hover:bg-muted/60 focus-visible:border-border focus-visible:bg-background min-h-[60px] resize-none border-transparent px-2 py-1.5 text-xs shadow-none transition-colors'
                value={meta.description}
                onChange={(e) => updateMeta({ description: e.target.value })}
              />
            </div>
            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                结束页标题
              </Label>
              <Input
                className='bg-muted/40 hover:bg-muted/60 focus-visible:border-border focus-visible:bg-background h-7 border-transparent px-2 text-xs shadow-none transition-colors'
                value={meta.endTitle}
                onChange={(e) => updateMeta({ endTitle: e.target.value })}
              />
            </div>
            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                结束页描述
              </Label>
              <Input
                className='bg-muted/40 hover:bg-muted/60 focus-visible:border-border focus-visible:bg-background h-7 border-transparent px-2 text-xs shadow-none transition-colors'
                value={meta.endDescription}
                onChange={(e) => updateMeta({ endDescription: e.target.value })}
              />
            </div>
            <div>
              <Label className='text-muted-foreground mb-1 block text-[11px] font-medium'>
                提交按钮文字
              </Label>
              <Input
                className='bg-muted/40 hover:bg-muted/60 focus-visible:border-border focus-visible:bg-background h-7 border-transparent px-2 text-xs shadow-none transition-colors'
                value={meta.submitLabel}
                onChange={(e) => updateMeta({ submitLabel: e.target.value })}
              />
            </div>
          </div>

          {/* Submission rules */}
          <div className='p-3'>
            <div className='mb-2 flex items-center justify-between'>
              <p className='text-muted-foreground/80 text-[10px] font-semibold tracking-wider uppercase'>
                提交规则
              </p>
              <span className='text-muted-foreground/60 font-mono text-[9px]'>
                AND
              </span>
            </div>
            <SubmissionRules />
          </div>
        </div>
      </div>
    </div>
  )
}
