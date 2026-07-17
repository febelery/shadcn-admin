import { describe, expect, it } from 'vitest'
import { serializeCondition } from '../../core/logic/condition-serializer'
import type { QuestionElement, Rule, SurveySchema } from '../../core/types'
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
    when: serializeCondition({
      source: 'q',
      ref: 'q1',
      operator: 'not_empty',
    }),
    action: {
      id: 'action-1',
      type: 'jump_to_question',
      target: 'q2',
    },
    ...overrides,
  }
}

function survey(overrides: Partial<SurveySchema> = {}): SurveySchema {
  return {
    id: 'survey-1',
    version: '4',
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
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
    },
    variables: [],
    sections: [
      {
        id: 'section-1',
        elements: [question('q1', '第一题'), question('q2', '第二题')],
      },
    ],
    rules: [rule()],
    validators: [],
    submission: {},
    ...overrides,
  }
}

describe('createFlowProjector', () => {
  it('returns one shared projection for the same schema', () => {
    const project = createFlowProjector()
    const schema = survey()

    expect(project(schema)).toBe(project(schema))
  })

  it('reuses the whole projection when unrelated settings change', () => {
    const project = createFlowProjector()
    const schema = survey()
    const before = project(schema)
    const after = project({
      ...schema,
      theme: { ...schema.theme, primaryColor: '#2563eb' },
      submission: { oncePerDevice: true },
    })

    expect(after).toBe(before)
  })

  it('updates labels without recomputing topology layout', () => {
    const project = createFlowProjector()
    const schema = survey()
    const before = project(schema)
    const firstSection = schema.sections[0]
    const firstQuestion = firstSection.elements[0] as QuestionElement
    const after = project({
      ...schema,
      sections: [
        {
          ...firstSection,
          elements: [
            { ...firstQuestion, title: '修改后的第一题' },
            ...firstSection.elements.slice(1),
          ],
        },
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
    const schema = survey({ rules: [] })
    const before = project(schema)
    const after = project({ ...schema, rules: [rule()] })

    expect(after.topologyKey).not.toBe(before.topologyKey)
    expect(after.layout).not.toBe(before.layout)
  })

  it('reuses layout when only a rule condition label changes', () => {
    const project = createFlowProjector()
    const schema = survey()
    const before = project(schema)
    const changedRule = rule({
      when: serializeCondition({
        source: 'q',
        ref: 'q1',
        operator: 'eq',
        value: 'q1-yes',
      }),
    })
    const after = project({ ...schema, rules: [changedRule] })

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
    const projection = project(survey({ rules: [invalidRule] }))

    expect(projection.stats.questionCount).toBe(2)
    expect(projection.stats.enabledRuleCount).toBe(1)
    expect(projection.issueStats.errors).toBeGreaterThan(0)
    expect(projection.issuesByRule.get('rule-1')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'jump_question_target',
          severity: 'error',
        }),
      ])
    )
  })
})
