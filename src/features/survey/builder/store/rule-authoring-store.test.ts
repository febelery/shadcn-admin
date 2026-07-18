import { beforeEach, describe, expect, it } from 'vitest'
import type { QuestionElement, SurveySchema } from '../../core/types'
import { useBuilderStore } from './index'

function question(id: string, title: string): QuestionElement {
  return {
    id,
    kind: 'question',
    type: 'text',
    title,
    required: false,
    config: {},
  }
}

function survey(): SurveySchema {
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
      primaryColor: '#000',
      backgroundColor: '#fff',
      borderRadius: '0.5rem',
    },
    variables: [],
    sections: [
      {
        id: 'section-1',
        elements: [question('q1', '第一题'), question('q2', '第二题')],
      },
    ],
    rules: [],
    validators: [],
    submission: {},
  }
}

describe('builder rule authoring interface', () => {
  beforeEach(() => {
    useBuilderStore.getState().init(survey())
  })

  it('does not dirty or mutate the survey until applying a new draft', () => {
    const state = useBuilderStore.getState()

    expect(state.beginRuleDraft({ type: 'new' })).toBe('started')
    expect(useBuilderStore.getState()).toMatchObject({
      isDirty: false,
      builderMode: 'flow',
    })
    expect(useBuilderStore.getState().schema?.rules).toEqual([])

    expect(useBuilderStore.getState().applyRuleDraft()).toBe(true)
    expect(useBuilderStore.getState().schema?.rules).toHaveLength(1)
    expect(useBuilderStore.getState().isDirty).toBe(true)
  })

  it('discards a new draft without changing the survey', () => {
    useBuilderStore.getState().beginRuleDraft({ type: 'new' })
    useBuilderStore.getState().discardRuleDraft()

    expect(useBuilderStore.getState().schema?.rules).toEqual([])
    expect(useBuilderStore.getState()).toMatchObject({
      ruleDraft: null,
      editingRuleId: null,
      isDirty: false,
    })
  })

  it('requires confirmation before replacing a changed draft', () => {
    useBuilderStore.getState().beginRuleDraft({ type: 'new' })

    expect(useBuilderStore.getState().beginRuleDraft({ type: 'new' })).toBe(
      'confirmation-required'
    )
    expect(useBuilderStore.getState().schema?.rules).toEqual([])
  })

  it('refuses to apply a draft with blocking validation issues', () => {
    useBuilderStore.getState().beginRuleDraft({ type: 'new' })
    useBuilderStore.getState().changeRuleDraft({
      type: 'condition',
      when: '{q.missing} notEmpty',
    })

    expect(useBuilderStore.getState().applyRuleDraft()).toBe(false)
    expect(useBuilderStore.getState().schema?.rules).toEqual([])
    expect(useBuilderStore.getState().isDirty).toBe(false)
  })
})
