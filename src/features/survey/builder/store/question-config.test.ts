import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/schema-defaults'
import { createBuilderStore } from './index'

describe('Builder question config interface', () => {
  it('applies dependent config changes atomically', () => {
    const document = createEmptySurvey()
    const sectionId = document.sections[0].id
    const store = createBuilderStore(document)

    store.getState().addQuestion(sectionId, 'slider')
    const slider = store.getState().document.sections[0].elements[0]
    expect(slider.kind).toBe('question')
    if (slider.kind !== 'question') return

    store
      .getState()
      .updateQuestionConfig(sectionId, slider.id, { minValue: 100 })

    expect(store.getState().document.sections[0].elements[0]).toMatchObject({
      type: 'slider',
      config: { minValue: 100, maxValue: 101, step: 1 },
    })
  })

  it('rejects a config field owned by another question type', () => {
    const document = createEmptySurvey()
    const sectionId = document.sections[0].id
    const store = createBuilderStore(document)
    store.getState().addQuestion(sectionId, 'signature')
    const signature = store.getState().document.sections[0].elements[0]

    expect(() =>
      store.getState().updateQuestionConfig(sectionId, signature.id, {
        placeholder: 'not supported',
      } as never)
    ).toThrow()
  })
})
