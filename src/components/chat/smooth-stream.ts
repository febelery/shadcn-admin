import { createUIMessageStream } from 'ai'
import type { ChatTransport } from './transport'

type QueueItem =
  | {
      kind: 'delta'
      type: 'text-delta' | 'reasoning-delta'
      id: string
      char: string
    }
  | {
      kind: 'event'
      event: any
    }

/**
 * 带有流式字符平滑与抖动缓冲的 UI 消息流转换器（Smooth Stream Buffer）
 *
 * 核心设计：
 * 使用统一 FIFO 队列严格保证因果时序（Causal Ordering）：
 * 1. `start` / `text-start` / `reasoning-start` 必须严格早于任何对应的 delta；
 * 2. 连续的大块 `text-delta` 在队列中被切解为字符序列，按 ~60fps 节奏平滑释放；
 * 3. `text-end` / `finish` 必须在当前文本队列完全排空后才发射，绝不产生提前或乱序。
 */
export function createSmoothStream(
  sourceStream: ReadableStream<any>,
  abortSignal?: AbortSignal
): ReadableStream<any> {
  const reader = sourceStream.getReader()

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const queue: QueueItem[] = []
      let deltaCount = 0
      let upstreamDone = false

      const sleep = (ms: number) =>
        new Promise<void>((resolve) => {
          if (abortSignal?.aborted) return resolve()
          const timer = setTimeout(() => {
            abortSignal?.removeEventListener('abort', onAbort)
            resolve()
          }, ms)
          const onAbort = () => {
            clearTimeout(timer)
            resolve()
          }
          abortSignal?.addEventListener('abort', onAbort, { once: true })
        })

      // 生产者协程：全速按序读取上游事件，推入统一 FIFO 队列
      const readUpstream = async () => {
        try {
          while (!abortSignal?.aborted) {
            const { done, value } = await reader.read()
            if (done) {
              upstreamDone = true
              break
            }
            if (
              value?.type === 'text-delta' ||
              value?.type === 'reasoning-delta'
            ) {
              for (const char of value.delta) {
                queue.push({
                  kind: 'delta',
                  type: value.type,
                  id: value.id,
                  char,
                })
                deltaCount++
              }
            } else {
              queue.push({ kind: 'event', event: value })
            }
          }
        } catch (err) {
          queue.push({
            kind: 'event',
            event: {
              type: 'error',
              errorText: err instanceof Error ? err.message : String(err),
            },
          })
        } finally {
          upstreamDone = true
        }
      }

      void readUpstream()

      // 消费者协程：统一队列单调调度，保证结构事件零延迟、文本增量平滑化
      while (!abortSignal?.aborted) {
        if (queue.length > 0) {
          const head = queue[0]

          // 结构/控制事件（start, text-start, tool, text-end, finish 等）：立即派发，不加延迟
          if (head.kind === 'event') {
            queue.shift()
            writer.write(head.event)
            continue
          }

          // 文本增量：根据积压量自适应聚合 1~8 字符，以 16ms 节奏放行
          let count = 0
          let text = ''
          const targetType = head.type
          const targetId = head.id
          const maxStep =
            deltaCount > 100 ? 8 : deltaCount > 40 ? 4 : deltaCount > 15 ? 2 : 1

          while (
            queue.length > 0 &&
            queue[0].kind === 'delta' &&
            queue[0].type === targetType &&
            queue[0].id === targetId &&
            count < maxStep
          ) {
            const item = queue.shift()!
            text += (item as Extract<QueueItem, { kind: 'delta' }>).char
            deltaCount--
            count++
          }

          if (text) {
            writer.write({ type: targetType, id: targetId, delta: text })
            await sleep(16)
          }
        } else if (upstreamDone) {
          break
        } else {
          await sleep(10)
        }
      }
    },
  })
}

/**
 * 为任意 ChatTransport 接缝注入平滑缓冲能力的装饰器
 */
export function createSmoothTransport(
  baseTransport: ChatTransport
): ChatTransport {
  return {
    sendMessages: async (options) => {
      const sourceStream = await baseTransport.sendMessages(options)
      if (!sourceStream) return sourceStream
      return createSmoothStream(sourceStream, options.abortSignal)
    },
    reconnectToStream: async (options) => {
      const sourceStream = await baseTransport.reconnectToStream?.(options)
      if (!sourceStream) return null
      return createSmoothStream(sourceStream)
    },
  }
}
