import { useState } from 'react'
import { LayoutGrid, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { QuestionNumberingProvider } from '../context/question-numbering-context'
import { InspectorPanel } from '../components/inspector-panel'
import { QuestionPalette } from '../components/question-palette'
import { builderWorkspace } from '../ui'
import { BuilderWorkspacePanel } from './workspace-panel'

const desktopOnly = 'hidden lg:flex'

/** 编辑器三栏布局；小屏仅中间工作区 + Sheet 打开侧栏 */
export function BuilderWorkspace() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)

  return (
    <>
      <QuestionNumberingProvider>
        <div className={builderWorkspace}>
          <QuestionPalette className={desktopOnly} />
          <BuilderWorkspacePanel />
          <InspectorPanel className={desktopOnly} />
        </div>
      </QuestionNumberingProvider>

      <div
        className='border-border bg-background/95 pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden'
      >
        <div className='pointer-events-auto flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 shadow-sm'
            onClick={() => setPaletteOpen(true)}
          >
            <LayoutGrid className='size-4' />
            题型库
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 gap-1.5 shadow-sm'
            onClick={() => setInspectorOpen(true)}
          >
            <Settings2 className='size-4' />
            属性
          </Button>
        </div>
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent
          side='left'
          className='flex w-[min(100vw,18rem)] flex-col gap-0 p-0 sm:max-w-xs'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>题型库</SheetTitle>
          </SheetHeader>
          <QuestionPalette
            className='flex h-full w-full max-w-none shrink border-0'
            onNavigate={() => setPaletteOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent
          side='right'
          className='flex w-[min(100vw,20rem)] flex-col gap-0 p-0 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>属性</SheetTitle>
          </SheetHeader>
          <InspectorPanel className='flex h-full w-full max-w-none shrink border-0' />
        </SheetContent>
      </Sheet>
    </>
  )
}
