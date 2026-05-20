import { useEffect } from 'react'
import {
  BUILDER_WORKSPACE_TARGET_ATTR,
  scrollIntoWorkspaceView,
} from './workspace-scroll'

type Options = {
  selectedElementId: string | null
}

/** 选中题目时，滚入工作区可视区域 */
export function useScrollSelectedIntoWorkspace({
  selectedElementId,
}: Options) {
  useEffect(() => {
    let cancelled = false
    let outer = 0
    let inner = 0

    const run = () => {
      if (cancelled || !selectedElementId) return

      const el = document.querySelector<HTMLElement>(
        `[${BUILDER_WORKSPACE_TARGET_ATTR}="${selectedElementId}"]`
      )
      if (el) scrollIntoWorkspaceView(el)
    }

    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(run)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [selectedElementId])
}
