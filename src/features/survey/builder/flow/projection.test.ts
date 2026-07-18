import { describe, expect, it } from 'vitest'
import type { QuestionElement, Rule, SurveyDocument } from '../../core/types'
import { createFlowProjector } from './projection'

function question(id: string, title: string): QuestionElement {
  return {
    id,
    kind: 'question',
    type: 'single_choice',
    title,
    required: false,
    config: {
      options: [
        { id: `${id}-yes`, label: '是' },
        { id: `${id}-no`, label: '否' },
      ],
    },
  }
}

function rule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: '跳到第二题',
    enabled: true,
    priority: 0,
    condition: { questionId: 'q1', operator: 'not_empty' },
    action: {
      id: 'action-1',
      type: 'jump_to_question',
      target: 'q2',
    },
    ...overrides,
  }
}

function createTestDocument(
  overrides: Partial<SurveyDocument> = {}
): SurveyDocument {
  return {
    id: 'survey-1',
    schemaVersion: 2,
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
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
    },
    elements: [question('q1', '第一题'), question('q2', '第二题')],
    rules: [rule()],
    submissionPolicy: {},
    ...overrides,
  }
}

describe('createFlowProjector', () => {
  it('returns one shared projection for the same document', () => {
    const project = createFlowProjector()
    const document = createTestDocument()

    expect(project(document)).toBe(project(document))
  })

  it('reuses the whole projection when unrelated settings change', () => {
    const project = createFlowProjector()
    const document = createTestDocument()
    const before = project(document)
    const after = project({
      ...document,
      theme: { ...document.theme, primaryColor: '#2563eb' },
      submissionPolicy: { perDeviceLimit: 1 },
    })

    expect(after).toBe(before)
  })

  it('updates labels without recomputing topology layout', () => {
    const project = createFlowProjector()
    const document = createTestDocument()
    const before = project(document)
    const firstQuestion = document.elements[0] as QuestionElement
    const after = project({
      ...document,
      elements: [
        { ...firstQuestion, title: '修改后的第一题' },
        ...document.elements.slice(1),
      ],
    })

    expect(after).not.toBe(before)
    expect(after.topologyKey).toBe(before.topologyKey)
    expect(after.layout).toBe(before.layout)
    expect(
      after.graph.nodes.find((node) => node.elementId === 'q1')?.label
    ).toBe('修改后的第一题')
  })

  it('recomputes layout when committed rule topology changes', () => {
    const project = createFlowProjector()
    const document = createTestDocument({ rules: [] })
    const before = project(document)
    const after = project({ ...document, rules: [rule()] })

    expect(after.topologyKey).not.toBe(before.topologyKey)
    expect(after.layout).not.toBe(before.layout)
  })

  it('reuses layout when only a rule condition label changes', () => {
    const project = createFlowProjector()
    const document = createTestDocument()
    const before = project(document)
    const changedRule = rule({
      condition: {
        questionId: 'q1',
        operator: 'eq',
        value: 'q1-yes',
      },
    })
    const after = project({ ...document, rules: [changedRule] })

    expect(after.topologyKey).toBe(before.topologyKey)
    expect(after.layout).toBe(before.layout)
    expect(
      after.graph.edges.find((edge) => edge.ruleId === 'rule-1')?.label
    ).toBe('等于 是')
  })

  it('indexes rule issues and summary data once for all consumers', () => {
    const project = createFlowProjector()
    const invalidRule = rule({
      action: {
        id: 'action-1',
        type: 'jump_to_question',
        target: 'missing-question',
      },
    })
    const projection = project(createTestDocument({ rules: [invalidRule] }))

    expect(projection.stats.questionCount).toBe(2)
    expect(projection.stats.enabledRuleCount).toBe(1)
    expect(projection.issueStats.errors).toBeGreaterThan(0)
    expect(projection.issuesByRule.get('rule-1')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'action_target',
          severity: 'error',
        }),
      ])
    )
  })
})
