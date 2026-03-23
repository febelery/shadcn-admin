'use client'
import { Settings2, LayoutTemplate, SlidersHorizontal } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useBuilderStore } from '@/features/survey-builder/store'
import { QuestionPanel } from './question-panel'
import { SurveySettingsPanel } from './survey-settings-panel'

// 面板内容（桌面端和移动端复用）
function PanelContent() {
  const { inspectorTarget, setInspectorTarget } = useBuilderStore()

  return (
    <Tabs
      value={inspectorTarget}
      onValueChange={(v) => setInspectorTarget(v as any)}
      className='flex flex-1 flex-col overflow-hidden h-full'
    >
      <TabsList className='bg-background flex h-14 w-full shrink-0 items-center justify-start gap-1.5 rounded-none border-b px-3 py-0'>
        <TabsTrigger
          value='node'
          className='data-[state=active]:bg-muted data-[state=active]:text-foreground flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all data-[state=active]:shadow-none'
        >
          <LayoutTemplate className='h-3.5 w-3.5 opacity-70' />
          题目属性
        </TabsTrigger>
        <TabsTrigger
          value='survey'
          className='data-[state=active]:bg-muted data-[state=active]:text-foreground flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all data-[state=active]:shadow-none'
        >
          <Settings2 className='h-3.5 w-3.5 opacity-70' />
          问卷设置
        </TabsTrigger>
      </TabsList>

      <div className='relative flex-1 overflow-hidden'>
        <TabsContent
          value='node'
          className='absolute inset-0 m-0 flex flex-col shadow-none outline-none data-[state=inactive]:hidden'
        >
          <QuestionPanel />
        </TabsContent>
        <TabsContent
          value='survey'
          className='absolute inset-0 m-0 flex flex-col shadow-none outline-none data-[state=inactive]:hidden'
        >
          <SurveySettingsPanel />
        </TabsContent>
      </div>
    </Tabs>
  )
}

// 布局适配：桌面端侧边栏，移动端使用 Sheet 抽屉
export function PropsPanel() {
  return (
    <>
      {/* 桌面端 */}
      <aside className='bg-background hidden h-full w-72 shrink-0 flex-col border-l lg:flex'>
        <PanelContent />
      </aside>

      {/* 移动端：右下角浮动按钮触发 Sheet */}
      <div className='lg:hidden'>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size='icon'
              className='fixed right-4 bottom-4 z-40 h-12 w-12 rounded-full shadow-lg'
            >
              <SlidersHorizontal className='h-5 w-5' />
            </Button>
          </SheetTrigger>
          <SheetContent side='right' className='w-80 p-0 flex flex-col'>
            <PanelContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
