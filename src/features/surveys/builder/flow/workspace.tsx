import { useState, useCallback, useEffect, useMemo } from 'react'
import { GitBranch, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { analyseSurvey } from '../../core/expression/parser'
import {
  buildFlowGraph,
  flowNodeDimensions,
  layoutFlowGraphWithMeta,
  START_ID,
} from '../../core/logic/flow-graph'
import { ruleMatchesSearch, getRuleCategory } from '../../core/logic/rule-meta'
import {
  getRulesForQuestion,
  ruleReferencesQuestionAsSource,
  summarizeRuleAction,
  createRuleAction,
} from '../../core/logic/rule-utils'
import { flattenQuestions } from '../../core/schema-defaults'
import {
  questionNumberColumn,
  questionPrefixCluster,
  questionTitleText,
} from '../../shared/question-layout'
import {
  getQuestionReferenceLabel,
  buildQuestionOrdinalMap,
  getQuestionNumberLabel,
  getSurveyDefaultNumberingStyle,
  getQuestionNumberPrefix,
} from '../../shared/question-numbering'
import {
  getQuestionManifest,
  getQuestionTypeLabel,
} from '../../shared/question-registry'
import { useBuilderStore } from '../store'
import { FlowContext, type FlowContextType } from './context'
import { CenterPanel } from './panels/center'
import { LeftPanel } from './panels/left'
import { RightPanel } from './panels/right'

const desktopOnly = 'hidden lg:flex'

function useIsMobileLayout() {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}

export function FlowWorkspace() {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const isMobile = useIsMobileLayout()

  const editingRuleId = useBuilderStore((s) => s.editingRuleId)

  const openEditor = useCallback(() => {
    if (isMobile) setEditorOpen(true)
  }, [isMobile])

  useEffect(() => {
    if (isMobile && editingRuleId) {
      queueMicrotask(() => setEditorOpen(true))
    }
  }, [isMobile, editingRuleId])

  const contextValue = useMemo<FlowContextType>(() => {
    return {
      analyseSurvey,
      buildFlowGraph,
      flowNodeDimensions,
      layoutFlowGraphWithMeta,
      START_ID,
      ruleMatchesSearch,
      getRuleCategory,
      getRulesForQuestion,
      ruleReferencesQuestionAsSource,
      summarizeRuleAction,
      createRuleAction,
      flattenQuestions,
      getQuestionReferenceLabel,
      getQuestionNumberPrefix,
      buildQuestionOrdinalMap,
      getQuestionNumberLabel,
      getSurveyDefaultNumberingStyle,
      getQuestionManifest,
      getQuestionTypeLabel,
      layout: {
        questionNumberColumn,
        questionPrefixCluster,
        questionTitleText,
      },
    }
  }, [])

  return (
    <FlowContext.Provider value={contextValue}>
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-80 min-w-0 shrink-0 flex-col overflow-hidden border-r 2xl:w-88',
            desktopOnly
          )}
        >
          <LeftPanel onNewRule={openEditor} />
        </aside>
        <main className='from-background via-muted/25 to-muted/40 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-linear-to-b'>
          <CenterPanel />
        </main>
        <aside
          className={cn(
            'border-border bg-muted/35 flex min-h-0 w-80 min-w-0 shrink-0 flex-col overflow-hidden border-l 2xl:w-88',
            desktopOnly
          )}
        >
          <RightPanel />
        </aside>
      </div>

      <div className='border-border bg-background/90 pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden'>
        <div className='pointer-events-auto flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => setRulesOpen(true)}
          >
            <GitBranch className='size-4' />
            规则
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 text-xs leading-none shadow-sm'
            onClick={() => setEditorOpen(true)}
          >
            <Settings2 className='size-4' />
            编辑
          </Button>
        </div>
      </div>

      <Sheet open={rulesOpen} onOpenChange={setRulesOpen}>
        <SheetContent
          side='left'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>逻辑规则</SheetTitle>
          </SheetHeader>
          <LeftPanel
            className='flex h-full w-full max-w-none shrink border-0'
            onNewRule={() => {
              openEditor()
              setRulesOpen(false)
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>属性</SheetTitle>
          </SheetHeader>
          <RightPanel className='flex h-full w-full max-w-none shrink border-0' />
        </SheetContent>
      </Sheet>
    </FlowContext.Provider>
  )
}
