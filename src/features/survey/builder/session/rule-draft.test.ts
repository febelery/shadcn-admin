import { describe, expect, it } from 'vitest'
import type { QuestionElement, Rule, SurveyDocument } from '../../core/types'
import {
  applyRuleDraft,
  beginRuleDraft,
  buildRuleDraftPreviewDocument,
  changeRuleDraft,
  deriveRuleDraftModel,
  getRuleDraftIssues,
  hasRuleDraftChanges,
} from './rule-draft'

function question(id: string, title: string): QuestionElement {
  return {
    id,
    kind: 'question',
    type: 'single_choice',
    title,
    required: false,
    config: { options: [{ id: `${id}-yes`, label: '是' }] },
  }
}

function existingRule(): Rule {
  return {
    id: 'rule-1',
    name: '显示 2. 第二题',
    enabled: true,
    priority: 0,
    condition: { questionId: 'q1', operator: 'not_empty' },
    action: { id: 'action-1', type: 'show', target: 'q2' },
  }
}

function createTestDocument(rules: Rule[] = [existingRule()]): SurveyDocument {
  return {
    id: 'survey-1',
    schemaVersion: 1,
    revision: 0,
    status: 'draft',
    meta: {
      title: '测试问卷',
      description: '',
      coverType: 'none',
      submitLabel: '提交',
      endTitle: '结束',
      endDescription: '',
      defaultQuestionNumbering: 'decimal',
      questionNumberingMode: 'global',
    },
    presentation: { type: 'scroll' },
    theme: {
      primaryColor: '#000',
      backgroundColor: '#fff',
      borderRadius: '0.5rem',
    },
    variables: [],
    sections: [
      {
        id: 'section-1',
        elements: [
          question('q1', '第一题'),
          question('q2', '第二题'),
          question('q3', '第三题'),
        ],
      },
    ],
    rules,
    validators: [],
    submission: {},
  }
}

describe('rule authoring', () => {
  it('creates a useful draft without changing the committed document', () => {
    const document = createTestDocument([])
    const draft = beginRuleDraft(document, { type: 'new' })

    expect(draft?.value).toMatchObject({
      name: '显示 2. 第二题',
      condition: { questionId: 'q1', operator: 'not_empty' },
      action: { type: 'show', target: 'q2' },
    })
    expect(document.rules).toEqual([])
    expect(hasRuleDraftChanges(draft)).toBe(true)
  })

  it('edits a copy and leaves the original rule untouched', () => {
    const document = createTestDocument()
    const draft = beginRuleDraft(document, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const changed = changeRuleDraft(document, draft, {
      type: 'action-type',
      actionType: 'jump_to_question',
    })

    expect(changed.value.action.type).toBe('jump_to_question')
    expect(changed.value.name).toBe('跳转到 2. 第二题')
    expect(document.rules[0]).toEqual(existingRule())
    expect(hasRuleDraftChanges(changed)).toBe(true)
  })

  it('derives available targets and normalizes a changed condition', () => {
    const document = createTestDocument()
    const draft = beginRuleDraft(document, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const changed = changeRuleDraft(document, draft, {
      type: 'condition',
      condition: { questionId: 'q2', operator: 'not_empty' },
    })
    const model = deriveRuleDraftModel(document, changed)

    expect(model.sourceId).toBe('q2')
    expect(changed.value.action.target).toBe('q3')
  })

  it('applies a draft exactly once', () => {
    const document = createTestDocument([])
    const draft = beginRuleDraft(document, { type: 'new' })!
    const rules = applyRuleDraft(document.rules, draft)

    expect(rules).toHaveLength(1)
    expect(rules[0]).toEqual(draft.value)
    expect(document.rules).toEqual([])
  })

  it('builds preview and validation without changing committed rules', () => {
    const document = createTestDocument()
    const draft = beginRuleDraft(document, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const invalid = changeRuleDraft(document, draft, {
      type: 'condition',
      condition: { questionId: 'missing', operator: 'not_empty' },
    })
    const preview = buildRuleDraftPreviewDocument(document, invalid)

    expect(preview.rules[0].condition.questionId).toBe('missing')
    expect(document.rules[0].condition.questionId).toBe('q1')
    expect(getRuleDraftIssues(document, invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'condition_question',
          severity: 'error',
        }),
      ])
    )
  })
})
