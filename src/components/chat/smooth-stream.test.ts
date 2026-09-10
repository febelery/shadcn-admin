import { describe, expect, it } from 'vitest'
import { createUIMessageStream } from 'ai'
import { createSmoothStream, createSmoothTransport } from './smooth-stream'
import type { ChatTransport } from './transport'

describe('smooth-stream', () => {
  it('应当将突发的单次大文本 chunk 拆解为多个平滑的小 delta 输出', async () => {
    const burstText =
      '这是一个模拟网络突发或离线中文长句一次性到达的场景，应当被平滑缓冲以打字机节奏释放。'

    const sourceStream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'start' })
        writer.write({ type: 'text-start', id: 't1' })
        writer.write({ type: 'text-delta', id: 't1', delta: burstText })
        writer.write({ type: 'text-end', id: 't1' })
        writer.write({ type: 'finish', finishReason: 'stop' })
      },
    })

    const smooth = createSmoothStream(sourceStream)
    const reader = smooth.getReader()
    const emittedDeltas: string[] = []
    let hasStart = false
    let hasEnd = false
    let hasFinish = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value.type === 'start') hasStart = true
      if (value.type === 'text-start') expect(value.id).toBe('t1')
      if (value.type === 'text-delta') emittedDeltas.push(value.delta)
      if (value.type === 'text-end') hasEnd = true
      if (value.type === 'finish') hasFinish = true
    }

    expect(hasStart).toBe(true)
    expect(hasEnd).toBe(true)
    expect(hasFinish).toBe(true)

    // 原本 1 次写入的大段文字，被平滑展开为多次细腻的 delta 输出
    expect(emittedDeltas.length).toBeGreaterThan(5)
    expect(emittedDeltas.join('')).toBe(burstText)
  })

  it('createSmoothTransport 能够无缝包装并代理底层 transport', async () => {
    const dummyTransport: ChatTransport = {
      sendMessages: async () => {
        return createUIMessageStream({
          execute: ({ writer }) => {
            writer.write({ type: 'start' })
            writer.write({ type: 'text-start', id: 't2' })
            writer.write({ type: 'text-delta', id: 't2', delta: '你好世界' })
            writer.write({ type: 'text-end', id: 't2' })
            writer.write({ type: 'finish', finishReason: 'stop' })
          },
        })
      },
      reconnectToStream: async () => null,
    }

    const smoothTransport = createSmoothTransport(dummyTransport)
    const stream = await smoothTransport.sendMessages({
      messages: [],
      trigger: 'submit-message',
      chatId: 'test',
      messageId: undefined,
      abortSignal: undefined,
    } as any)
    expect(stream).toBeDefined()

    const reader = stream!.getReader()
    const collected: string[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value.type === 'text-delta') {
        collected.push(value.delta)
      }
    }
    expect(collected.join('')).toBe('你好世界')
  })

  it('必须保证 text-start 严格先于任何 text-delta 派发，且 text-end 严格后于所有 text-delta', async () => {
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: 'start' })
        writer.write({ type: 'text-start', id: 'target-id' })
        writer.write({
          type: 'text-delta',
          id: 'target-id',
          delta: '流式测试内容段落',
        })
        writer.write({ type: 'text-end', id: 'target-id' })
        writer.write({ type: 'finish', finishReason: 'stop' })
      },
    })

    const smooth = createSmoothStream(stream)
    const reader = smooth.getReader()
    const types: string[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      types.push(value.type)
    }

    const startIdx = types.indexOf('text-start')
    const firstDeltaIdx = types.indexOf('text-delta')
    const lastDeltaIdx = types.lastIndexOf('text-delta')
    const endIdx = types.indexOf('text-end')
    const finishIdx = types.indexOf('finish')

    expect(startIdx).toBeGreaterThanOrEqual(0)
    expect(firstDeltaIdx).toBeGreaterThan(startIdx)
    expect(endIdx).toBeGreaterThan(lastDeltaIdx)
    expect(finishIdx).toBeGreaterThan(endIdx)
  })
})
