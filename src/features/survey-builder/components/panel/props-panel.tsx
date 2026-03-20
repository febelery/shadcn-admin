'use client'
import { Settings2, LayoutTemplate } from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useBuilderStore } from '@/features/survey-builder/store'
import { QuestionPanel } from './question-panel'
import { SurveySettingsPanel } from './survey-settings-panel'

export function PropsPanel() {
  const { contextMode, setContextMode } = useBuilderStore()

  return (
    <aside className='flex h-full w-72 shrink-0 flex-col border-l border-border bg-background'>
      <Tabs
        value={contextMode}
        onValueChange={(v) => setContextMode(v as any)}
        className='flex flex-1 flex-col overflow-hidden'
      >
        <TabsList className='bg-background dark:bg-background h-10 w-full shrink-0 justify-start rounded-none border-b p-1 gap-1'>
          <TabsTrigger
            value='question'
            className='flex-1 gap-1.5 text-[11px] font-medium transition-all data-[state=active]:bg-secondary data-[state=active]:shadow-none'
          >
            <LayoutTemplate className='h-3 w-3' />
            题目属性
          </TabsTrigger>
          <TabsTrigger
            value='survey'
            className='flex-1 gap-1.5 text-[11px] font-medium transition-all data-[state=active]:bg-secondary data-[state=active]:shadow-none'
          >
            <Settings2 className='h-3 w-3' />
            问卷设置
          </TabsTrigger>
        </TabsList>

        <div className='flex-1 overflow-hidden relative'>
          <TabsContent value='question' className='absolute inset-0 m-0 flex flex-col outline-none data-[state=inactive]:hidden shadow-none'>
            <QuestionPanel />
          </TabsContent>
          <TabsContent value='survey' className='absolute inset-0 m-0 flex flex-col outline-none data-[state=inactive]:hidden shadow-none'>
            <SurveySettingsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}