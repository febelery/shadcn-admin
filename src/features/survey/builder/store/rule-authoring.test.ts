import { describe, expect, it } from 'vitest'
import { serializeCondition } from '../../core/logic/condition-serializer'
import type { QuestionElement, Rule, SurveySchema } from '../../core/types'
import {
  applyRuleDraft,
  beginRuleDraft,
  buildRuleDraftPreviewSchema,
  changeRuleDraft,
  deriveRuleDraftModel,
  getRuleDraftIssues,
  hasRuleDraftChanges,
} from './rule-authoring'

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
    when: serializeCondition({
      source: 'q',
      ref: 'q1',
      operator: 'not_empty',
    }),
    action: { id: 'action-1', type: 'show', target: 'q2' },
  }
}

function survey(rules: Rule[] = [existingRule()]): SurveySchema {
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
  it('creates a useful draft without changing the committed schema', () => {
    const schema = survey([])
    const draft = beginRuleDraft(schema, { type: 'new' })

    expect(draft?.value).toMatchObject({
      name: '显示 2. 第二题',
      when: '{q.q1} notEmpty',
      action: { type: 'show', target: 'q2' },
    })
    expect(schema.rules).toEqual([])
    expect(hasRuleDraftChanges(draft)).toBe(true)
  })

  it('edits a copy and leaves the original rule untouched', () => {
    const schema = survey()
    const draft = beginRuleDraft(schema, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const changed = changeRuleDraft(schema, draft, {
      type: 'action-type',
      actionType: 'jump_to_question',
    })

    expect(changed.value.action.type).toBe('jump_to_question')
    expect(changed.value.name).toBe('跳转到 2. 第二题')
    expect(schema.rules[0]).toEqual(existingRule())
    expect(hasRuleDraftChanges(changed)).toBe(true)
  })

  it('derives available targets and normalizes a changed condition', () => {
    const schema = survey()
    const draft = beginRuleDraft(schema, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const changed = changeRuleDraft(schema, draft, {
      type: 'condition',
      when: serializeCondition({
        source: 'q',
        ref: 'q2',
        operator: 'not_empty',
      }),
    })
    const model = deriveRuleDraftModel(schema, changed)

    expect(model.sourceId).toBe('q2')
    expect(changed.value.action.target).toBe('q3')
  })

  it('applies a draft exactly once', () => {
    const schema = survey([])
    const draft = beginRuleDraft(schema, { type: 'new' })!
    const rules = applyRuleDraft(schema.rules, draft)

    expect(rules).toHaveLength(1)
    expect(rules[0]).toEqual(draft.value)
    expect(schema.rules).toEqual([])
  })

  it('builds preview and validation without changing committed rules', () => {
    const schema = survey()
    const draft = beginRuleDraft(schema, {
      type: 'existing',
      ruleId: 'rule-1',
    })!
    const invalid = changeRuleDraft(schema, draft, {
      type: 'condition',
      when: '{q.missing} notEmpty',
    })
    const preview = buildRuleDraftPreviewSchema(schema, invalid)

    expect(preview.rules[0].when).toBe('{q.missing} notEmpty')
    expect(schema.rules[0].when).toBe('{q.q1} notEmpty')
    expect(getRuleDraftIssues(schema, invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'expr_ref', severity: 'error' }),
      ])
    )
  })
})
