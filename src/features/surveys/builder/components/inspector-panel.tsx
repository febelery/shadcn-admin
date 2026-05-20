import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Editor } from '@/components/ui/editor'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getEditorSection } from '../../core/editor-schema'
import type { SurveyElement } from '../../core/types'
import { useBuilderStore } from '../store'
import {
  builderGuidancePanel,
  builderInspectorForm,
  builderPanelInspector,
  builderPanelScroll,
  builderSidePanelBody,
  builderSpaceTight,
  builderTypeBody,
  builderTypeHeadline,
  builderTypeLabel,
} from '../ui'
import { BuilderGuidance } from './builder-guidance'
import { BuilderPanelHeader } from './builder-panel-header'
import { QuestionInspector } from './question-inspector'
import { SurveySettingsInspector } from './survey-settings-inspector'

function LayoutInspector({
  sectionId,
  el,
}: {
  sectionId: string
  el: SurveyElement
}) {
  const updateHtmlBlock = useBuilderStore((s) => s.updateHtmlBlock)
  const removeElement = useBuilderStore((s) => s.removeElement)

  if (el.kind === 'divider') {
    return (
      <div className={builderInspectorForm}>
        <p className={cn(builderTypeBody, 'text-muted-foreground')}>
          分割线无额外配置
        </p>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(sectionId, el.id)}
        >
          删除分割线
        </Button>
      </div>
    )
  }

  if (el.kind === 'html_block') {
    return (
      <div className={builderInspectorForm}>
        <div className={cn('flex flex-col', builderSpaceTight)}>
          <Label className={builderTypeLabel}>说明内容</Label>
          <Editor
            variant='plain'
            value={el.html}
            onChange={(html) => updateHtmlBlock(sectionId, el.id, { html })}
            placeholder='输入说明内容…'
          />
        </div>
        <Button
          variant='destructive'
          size='sm'
          className='w-full'
          onClick={() => removeElement(sectionId, el.id)}
        >
          删除说明块
        </Button>
      </div>
    )
  }

  return null
}

type Props = {
  className?: string
}

export function InspectorPanel({ className }: Props = {}) {
  const schema = useBuilderStore((s) => s.schema)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const selectedElementId = useBuilderStore((s) => s.selectedElementId)

  if (!schema || !selectedSectionId) {
    return (
      <aside className={cn(builderPanelInspector, className)}>
        <BuilderPanelHeader icon={Settings2} title='属性' />
        <div className={builderSidePanelBody}>
          <p className={cn(builderTypeBody, 'text-muted-foreground p-4')}>
            加载中…
          </p>
        </div>
      </aside>
    )
  }

  const section = getEditorSection(schema)
  const selectedEl = section?.elements.find((e) => e.id === selectedElementId)

  return (
    <aside className={cn(builderPanelInspector, className)}>
      <Tabs
        defaultValue='element'
        className='flex min-h-0 flex-1 flex-col gap-0'
      >
        <BuilderPanelHeader
          icon={Settings2}
          title='属性'
          action={
            <TabsList className='grid h-8 shrink-0 grid-cols-2'>
              <TabsTrigger value='element' className='px-2.5 text-xs'>
                题目
              </TabsTrigger>
              <TabsTrigger value='settings' className='px-2.5 text-xs'>
                问卷设置
              </TabsTrigger>
            </TabsList>
          }
        />
        <div className={builderSidePanelBody}>
          <ScrollArea className={builderPanelScroll}>
            <div className='min-w-0 overflow-x-hidden p-4'>
              <TabsContent value='element' className='mt-0 outline-none'>
                {selectedEl?.kind === 'question' && (
                  <QuestionInspector
                    sectionId={selectedSectionId}
                    el={selectedEl}
                  />
                )}
                {(selectedEl?.kind === 'divider' ||
                  selectedEl?.kind === 'html_block') && (
                  <LayoutInspector
                    sectionId={selectedSectionId}
                    el={selectedEl}
                  />
                )}
                {!selectedEl && (
                  <BuilderGuidance
                    className={builderGuidancePanel}
                    density='compact'
                    title='未选中元素'
                    description={
                      <>
                        在画布上点击题目或布局块以编辑属性。问卷级设置请切换到
                        <strong className={builderTypeHeadline}>
                          「问卷设置」
                        </strong>
                        。
                      </>
                    }
                  />
                )}
              </TabsContent>
              <TabsContent value='settings' className='mt-0 outline-none'>
                <SurveySettingsInspector />
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>
    </aside>
  )
}
