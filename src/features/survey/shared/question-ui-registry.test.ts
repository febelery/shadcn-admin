import { describe, expect, it } from 'vitest'
import { QUESTION_TYPES } from '../core/types'
import {
  getQuestionUiManifest,
  QUESTION_UI_MANIFESTS,
} from './question-ui-registry'

describe('question UI registry', () => {
  it('defines presentation metadata for every question type', () => {
    expect(QUESTION_UI_MANIFESTS.map((manifest) => manifest.type)).toEqual(
      QUESTION_TYPES
    )

    for (const type of QUESTION_TYPES) {
      expect(getQuestionUiManifest(type)).toMatchObject({ type })
    }
  })
})
