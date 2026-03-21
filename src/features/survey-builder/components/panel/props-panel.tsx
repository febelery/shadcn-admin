'use client'
import { Settings2, LayoutTemplate } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useBuilderStore } from '@/features/survey-builder/store'
import { QuestionPanel } from './question-panel'
import { SurveySettingsPanel } from './survey-settings-panel'

export function PropsPanel() {
  const { inspectorTarget, setInspectorTarget } = useBuilderStore()

  return (
    <aside className='border-border bg-background flex h-full w-72 shrink-0 flex-col border-l'>
      <Tabs
        value={inspectorTarget}
        onValueChange={(v) => setInspectorTarget(v as any)}
        className='flex flex-1 flex-col overflow-hidden'
      >
        <TabsList className='bg-background dark:bg-background h-10 w-full shrink-0 justify-start gap-1 rounded-none border-b p-1'>
          <TabsTrigger
            value='node'
            className='data-[state=active]:bg-secondary flex-1 gap-1.5 text-[11px] font-medium transition-all data-[state=active]:shadow-none'
          >
            <LayoutTemplate className='h-3 w-3' />
            题目属性
          </TabsTrigger>
          <TabsTrigger
            value='survey'
            className='data-[state=active]:bg-secondary flex-1 gap-1.5 text-[11px] font-medium transition-all data-[state=active]:shadow-none'
          >
            <Settings2 className='h-3 w-3' />
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
