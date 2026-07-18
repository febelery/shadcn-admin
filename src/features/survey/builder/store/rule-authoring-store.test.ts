import { beforeEach, describe, expect, it } from 'vitest'
import type { QuestionElement, SurveySchema } from '../../core/types'
import { createBuilderStore, type BuilderStore } from './index'

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
        elements: [question('q1', '第一题'), question('q2', '第二题')],
      },
    ],
    rules: [],
    validators: [],
    submission: {},
  }
}

describe('builder rule authoring interface', () => {
  let store: BuilderStore

  beforeEach(() => {
    store = createBuilderStore(survey())
  })

  it('does not dirty or mutate the survey until applying a new draft', () => {
    const state = store.getState()

    expect(state.beginRuleDraft({ type: 'new' })).toBe('started')
    expect(store.getState()).toMatchObject({
      isDirty: false,
      builderMode: 'flow',
    })
    expect(store.getState().document.rules).toEqual([])

    expect(store.getState().applyRuleDraft()).toBe(true)
    expect(store.getState().document.rules).toHaveLength(1)
    expect(store.getState().isDirty).toBe(true)
  })

  it('discards a new draft without changing the survey', () => {
    store.getState().beginRuleDraft({ type: 'new' })
    store.getState().discardRuleDraft()

    expect(store.getState().document.rules).toEqual([])
    expect(store.getState()).toMatchObject({
      ruleDraft: null,
      editingRuleId: null,
      isDirty: false,
    })
  })

  it('requires confirmation before replacing a changed draft', () => {
    store.getState().beginRuleDraft({ type: 'new' })

    expect(store.getState().beginRuleDraft({ type: 'new' })).toBe(
      'confirmation-required'
    )
    expect(store.getState().document.rules).toEqual([])
  })

  it('refuses to apply a draft with blocking validation issues', () => {
    store.getState().beginRuleDraft({ type: 'new' })
    store.getState().changeRuleDraft({
      type: 'condition',
      when: '{q.missing} notEmpty',
    })

    expect(store.getState().applyRuleDraft()).toBe(false)
    expect(store.getState().document.rules).toEqual([])
    expect(store.getState().isDirty).toBe(false)
  })

  it('creates isolated sessions for different surveys', () => {
    const other = createBuilderStore({ ...survey(), id: 'survey-2' })

    store.getState().updateMeta({ title: '会话一' })

    expect(store.getState().document.meta.title).toBe('会话一')
    expect(other.getState().document.meta.title).toBe('测试问卷')
  })
})
