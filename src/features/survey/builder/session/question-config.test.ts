import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/document-factory'
import { createBuilderStore } from './store'

describe('Builder question config interface', () => {
  it('applies dependent config changes atomically', () => {
    const document = createEmptySurvey()
    const store = createBuilderStore(document)

    store.getState().addQuestion('slider')
    const slider = store.getState().document.elements[0]
    expect(slider.kind).toBe('question')
    if (slider.kind !== 'question') return

    store.getState().updateQuestionConfig(slider.id, { minValue: 100 })

    expect(store.getState().document.elements[0]).toMatchObject({
      type: 'slider',
      config: { minValue: 100, maxValue: 101, step: 1 },
    })
  })

  it('rejects a config field owned by another question type', () => {
    const document = createEmptySurvey()
    const store = createBuilderStore(document)
    store.getState().addQuestion('rating')
    const rating = store.getState().document.elements[0]

    expect(() =>
      store.getState().updateQuestionConfig(rating.id, {
        placeholder: 'not supported',
      } as never)
    ).toThrow()
  })
})
