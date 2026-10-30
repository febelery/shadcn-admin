import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/document-factory'
import { documentToSurveySettingsValues } from '../../settings/form-schema'
import { createBuilderStore } from './store'

describe('Builder session store', () => {
  it('adopts canonical published document and tracks dirty state', () => {
    const store = createBuilderStore(createEmptySurvey('Draft'))
    store.getState().updateMeta({ title: 'Ready to publish' })

    const saved = store.getState().getDocumentSnapshot()
    const published = {
      ...saved,
      status: 'published' as const,
      revision: 1,
      slug: 'ready-to-publish',
      publishedAt: '2026-07-18T05:00:00.000Z',
    }

    store.getState().adoptDocument(published)

    expect(store.getState().isDirty).toBe(false)
    expect(store.getState().document).toEqual(published)

    store.getState().updateMeta({ title: 'Published update' })
    expect(store.getState().isDirty).toBe(true)
  })

  it('duplicates element and remaps nested IDs', () => {
    const document = createEmptySurvey()
    const store = createBuilderStore(document)
    store.getState().addQuestion('single_choice')

    const source = store.getState().document.elements[0]
    store.getState().duplicateElement(source.id)

    const [original, copy] = store.getState().document.elements
    expect(copy).toMatchObject({ kind: 'question', type: 'single_choice' })
    expect(copy.id).not.toBe(original.id)

    if (original.kind !== 'question' || copy.kind !== 'question') return
    expect(copy.config.options?.map((option) => option.id)).not.toEqual(
      original.config.options?.map((option) => option.id)
    )
  })

  it('updates settings without throwing and marks dirty', () => {
    const store = createBuilderStore(createEmptySurvey('Initial'))
    const formValues = documentToSurveySettingsValues(store.getState().document)
    formValues.title = 'Updated Title'
    formValues.primaryColor = '#ff5500'

    expect(() => {
      store.getState().updateSettings(formValues)
    }).not.toThrow()

    expect(store.getState().isDirty).toBe(true)
    expect(store.getState().document.meta.title).toBe('Updated Title')
    expect(store.getState().document.theme.primaryColor).toBe('#ff5500')
  })

  it('applies dependent question config changes', () => {
    const document = createEmptySurvey()
    const store = createBuilderStore(document)

    store.getState().addQuestion('slider')
    const slider = store.getState().document.elements[0]
    if (slider.kind !== 'question') return

    store.getState().updateQuestionConfig(slider.id, { minValue: 100 })

    expect(store.getState().document.elements[0]).toMatchObject({
      type: 'slider',
      config: { minValue: 100, maxValue: 101, step: 1 },
    })
  })
})
