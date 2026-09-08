import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/document-factory'
import { documentToSurveySettingsValues } from '../../settings/form-schema'
import { createBuilderStore } from './store'

describe('Builder document lifecycle', () => {
  it('adopts the canonical published document', () => {
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
    expect(store.getState().getDocumentSnapshot()).toMatchObject({
      status: 'published',
      revision: 1,
      slug: 'ready-to-publish',
      publishedAt: '2026-07-18T05:00:00.000Z',
    })
  })

  it('returns an isolated persistence snapshot', () => {
    const store = createBuilderStore(createEmptySurvey('Original'))
    const snapshot = store.getState().getDocumentSnapshot()

    snapshot.meta.title = 'Mutated outside the session'

    expect(store.getState().document.meta.title).toBe('Original')
  })

  it('removes optional submission policy fields when they are cleared', () => {
    const store = createBuilderStore(createEmptySurvey())

    store.getState().updateSubmissionPolicy({
      totalLimit: 100,
      perUserLimit: 2,
      accessPassword: 'secret',
    })
    store.getState().updateSubmissionPolicy({
      totalLimit: undefined,
      accessPassword: undefined,
    })

    expect(store.getState().document.submissionPolicy).toEqual({
      perUserLimit: 2,
    })
    expect(store.getState().isDirty).toBe(true)
  })

  it('updates settings without DataCloneError and marks dirty', () => {
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
})
