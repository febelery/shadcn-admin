import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../../core/schema-defaults'
import { createBuilderStore } from './index'

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
})
