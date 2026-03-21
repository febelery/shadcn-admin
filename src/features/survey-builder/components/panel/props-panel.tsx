'use client'
import { Settings2, LayoutTemplate } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBuilderStore } from '@/features/survey-builder/store'
import { QuestionPanel } from './question-panel'
import { SurveySettingsPanel } from './survey-settings-panel'

export function PropsPanel() {
  const { inspectorTarget, setInspectorTarget } = useBuilderStore()

  return (
    <aside className='bg-background hidden h-full w-72 shrink-0 flex-col border-l lg:flex'>
      <Tabs
        value={inspectorTarget}
        onValueChange={(v) => setInspectorTarget(v as any)}
        className='flex flex-1 flex-col overflow-hidden'
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
    </aside>
  )
}
