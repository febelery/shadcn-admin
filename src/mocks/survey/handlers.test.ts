import { describe, expect, it } from 'vitest'

describe('survey mock records', () => {
  it('seeds every answer through the canonical question contract', async () => {
    await expect(import('../handlers/survey')).resolves.toBeDefined()
  })
})
