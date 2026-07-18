import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/document-factory'
import { createBuilderStore } from './store'

describe('Builder element duplication interface', () => {
  it('copies a plain document element and remaps nested identities', () => {
    const document = createEmptySurvey()
    const sectionId = document.sections[0].id
    const store = createBuilderStore(document)
    store.getState().addQuestion(sectionId, 'single_choice')

    const source = store.getState().document.sections[0].elements[0]
    store.getState().duplicateElement(sectionId, source.id)

    const [original, copy] = store.getState().document.sections[0].elements
    expect(copy).toMatchObject({ kind: 'question', type: 'single_choice' })
    expect(copy.id).not.toBe(original.id)

    if (original.kind !== 'question' || copy.kind !== 'question') return
    expect(copy.config.options?.map((option) => option.label)).toEqual(
      original.config.options?.map((option) => option.label)
    )
    expect(copy.config.options?.map((option) => option.id)).not.toEqual(
      original.config.options?.map((option) => option.id)
    )
  })
})
