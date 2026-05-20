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
