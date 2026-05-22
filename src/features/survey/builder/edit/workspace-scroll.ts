import { useEffect } from 'react'

/** 工作区滚动容器标记，供 scrollIntoWorkspaceView 定位 */
export const BUILDER_WORKSPACE_SCROLL_ATTR = 'data-builder-workspace-scroll'

/** 可滚入视窗的工作区节点标记（如选中题目卡片） */
export const BUILDER_WORKSPACE_TARGET_ATTR = 'data-builder-workspace-target'

const VIEW_PADDING_PX = 16

/**
 * 将节点滚入工作区滚动区可视范围（仅滚动中间栏，不带动整页）。
 */
export function scrollIntoWorkspaceView(target: HTMLElement) {
  const root = target.closest<HTMLElement>(`[${BUILDER_WORKSPACE_SCROLL_ATTR}]`)
  if (!root) {
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    return
  }

  const rootRect = root.getBoundingClientRect()
  const rect = target.getBoundingClientRect()

  if (rect.top < rootRect.top + VIEW_PADDING_PX) {
    root.scrollBy({
      top: rect.top - rootRect.top - VIEW_PADDING_PX,
      behavior: 'smooth',
    })
    return
  }

  if (rect.bottom > rootRect.bottom - VIEW_PADDING_PX) {
    root.scrollBy({
      top: rect.bottom - rootRect.bottom + VIEW_PADDING_PX,
      behavior: 'smooth',
    })
  }
}

type ScrollOptions = {
  selectedElementId: string | null
}

/** 选中题目时，滚入工作区可视区域 */
export function useScrollSelectedIntoWorkspace({
  selectedElementId,
}: ScrollOptions) {
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
