import type { BuilderMode } from '../../core/types'

export type LogicMobilePanel = 'closed' | 'rules' | 'editor'

export interface BuilderNavigationSnapshot {
  builderMode: BuilderMode
  editingRuleId: string | null
  selectedElementId: string | null
  logicMobilePanel: LogicMobilePanel
}

export type BuilderNavigationIntent =
  | { type: 'show-edit' }
  | { type: 'show-flow' }
  | { type: 'show-rule-list' }
  | { type: 'show-current-rule-editor' }
  | { type: 'show-rule-editor'; ruleId: string }
  | { type: 'close-mobile-panel' }
  | { type: 'clear-rule-focus' }

/**
 * 将用户导航意图解析为一个原子焦点状态。
 * 调用者无需知道模式、规则、题目和移动端面板之间的互斥顺序。
 */
export function resolveBuilderNavigation(
  current: BuilderNavigationSnapshot,
  intent: BuilderNavigationIntent
): BuilderNavigationSnapshot {
  switch (intent.type) {
    case 'show-edit':
      return {
        ...current,
        builderMode: 'edit',
        editingRuleId: null,
        logicMobilePanel: 'closed',
      }
    case 'show-flow':
      return {
        ...current,
        builderMode: 'flow',
        logicMobilePanel: 'closed',
      }
    case 'show-rule-list':
      return {
        ...current,
        builderMode: 'flow',
        logicMobilePanel: 'rules',
      }
    case 'show-current-rule-editor':
      return {
        ...current,
        builderMode: 'flow',
        selectedElementId: current.editingRuleId
          ? null
          : current.selectedElementId,
        logicMobilePanel: 'editor',
      }
    case 'show-rule-editor':
      return {
        ...current,
        builderMode: 'flow',
        editingRuleId: intent.ruleId,
        selectedElementId: null,
        logicMobilePanel:
          current.logicMobilePanel === 'rules'
            ? 'editor'
            : current.logicMobilePanel,
      }
    case 'close-mobile-panel':
      return { ...current, logicMobilePanel: 'closed' }
    case 'clear-rule-focus':
      return {
        ...current,
        editingRuleId: null,
        logicMobilePanel: 'closed',
      }
  }
}
