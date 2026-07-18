import type { StaticIssue } from '../../core/logic/analyzer'
import type { SurveyDocument } from '../../core/types'
import {
  buildRuleDraftPreviewDocument,
  filterRuleDraftIssues,
  type RuleDraft,
} from '../session/rule-draft'
import { createFlowProjector, type FlowProjection } from './projection'

export interface FlowWorkspaceProjection {
  committed: FlowProjection
  canvas: FlowProjection
  draftIssues?: StaticIssue[]
}

/**
 * 会话级流程读模型。返回值仅在流程输入或规则草稿变化时更新，供 Zustand
 * 直接以引用相等判断是否需要唤醒 React。
 */
export function createFlowWorkspaceProjector() {
  const projectCommitted = createFlowProjector()
  const projectPreview = createFlowProjector()
  let previousCommitted: FlowProjection | null = null
  let previousDraft: RuleDraft | null = null
  let previousResult: FlowWorkspaceProjection | null = null

  return (
    document: SurveyDocument,
    draft: RuleDraft | null
  ): FlowWorkspaceProjection => {
    const committed = projectCommitted(document)
    if (
      committed === previousCommitted &&
      draft === previousDraft &&
      previousResult
    ) {
      return previousResult
    }

    let canvas = committed
    let draftIssues: StaticIssue[] | undefined
    if (draft) {
      const previewDocument = buildRuleDraftPreviewDocument(document, draft)
      const preview = projectPreview(previewDocument)
      canvas = {
        ...preview,
        // 草稿只叠加边，不参与正式拓扑布局和视口失效。
        layout: committed.layout,
        topologyKey: committed.topologyKey,
      }
      draftIssues = filterRuleDraftIssues(preview.issues, draft)
    }

    const result = { committed, canvas, draftIssues }
    previousCommitted = committed
    previousDraft = draft
    previousResult = result
    return result
  }
}
