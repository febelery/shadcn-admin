import { describe, expect, it } from 'vitest'
import {
  resolveBuilderNavigation,
  type BuilderNavigationSnapshot,
} from './navigation'

const editFocus: BuilderNavigationSnapshot = {
  builderMode: 'edit',
  editingRuleId: null,
  selectedElementId: 'question-1',
  logicMobilePanel: 'closed',
}

describe('resolveBuilderNavigation', () => {
  it('opens a rule editor as one atomic navigation', () => {
    expect(
      resolveBuilderNavigation(editFocus, {
        type: 'show-rule-editor',
        ruleId: 'rule-1',
      })
    ).toEqual({
      builderMode: 'flow',
      editingRuleId: 'rule-1',
      selectedElementId: null,
      logicMobilePanel: 'editor',
    })
  })

  it('returns to edit mode without leaving rule focus or a mobile panel behind', () => {
    const flowFocus: BuilderNavigationSnapshot = {
      builderMode: 'flow',
      editingRuleId: 'rule-1',
      selectedElementId: null,
      logicMobilePanel: 'editor',
    }

    expect(resolveBuilderNavigation(flowFocus, { type: 'show-edit' })).toEqual({
      builderMode: 'edit',
      editingRuleId: null,
      selectedElementId: null,
      logicMobilePanel: 'closed',
    })
  })

  it('opens and closes the mobile rule list without losing rule focus', () => {
    const focused: BuilderNavigationSnapshot = {
      ...editFocus,
      builderMode: 'flow',
      editingRuleId: 'rule-1',
      selectedElementId: null,
    }
    const listOpen = resolveBuilderNavigation(focused, {
      type: 'show-rule-list',
    })

    expect(listOpen.logicMobilePanel).toBe('rules')
    expect(listOpen.editingRuleId).toBe('rule-1')
    expect(
      resolveBuilderNavigation(listOpen, { type: 'show-flow' })
    ).toMatchObject({
      builderMode: 'flow',
      editingRuleId: 'rule-1',
      logicMobilePanel: 'closed',
    })
  })

  it('opens the current editor without inventing a rule selection', () => {
    expect(
      resolveBuilderNavigation(editFocus, {
        type: 'show-current-rule-editor',
      })
    ).toEqual({
      builderMode: 'flow',
      editingRuleId: null,
      selectedElementId: 'question-1',
      logicMobilePanel: 'editor',
    })
  })

  it('clears rule focus and closes its mobile panel together', () => {
    const focused: BuilderNavigationSnapshot = {
      builderMode: 'flow',
      editingRuleId: 'rule-1',
      selectedElementId: null,
      logicMobilePanel: 'editor',
    }

    expect(
      resolveBuilderNavigation(focused, { type: 'clear-rule-focus' })
    ).toEqual({
      builderMode: 'flow',
      editingRuleId: null,
      selectedElementId: null,
      logicMobilePanel: 'closed',
    })
  })
})
