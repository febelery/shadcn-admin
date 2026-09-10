import { createUIMessageStream } from 'ai'
import type { ChatTransport } from '@/components/chat/transport'
import type { ChatMessage } from '@/components/chat/types'
import { createDemoTransport } from './scripted-chat'

const OPENROUTER_URL =
  import.meta.env.VITE_OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
const OPENROUTER_MODEL =
  import.meta.env.VITE_OPENROUTER_MODEL || 'openrouter/free'
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

type OpenRouterMessage = {
  role: 'user' | 'assistant'
  content: string
}

function messageText(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('')
}

async function parseResponseError(response: Response): Promise<string> {
  const status = response.status
  let rawText = ''
  try {
    rawText = await response.text()
  } catch {
    return `请求失败 (${status} ${response.statusText})`
  }

  // 1. 尝试解析标准 JSON 错误响应
  try {
    const json = JSON.parse(rawText)
    const message =
      json?.error?.message ||
      json?.message ||
      (typeof json?.error === 'string' ? json.error : null)
    if (message) {
      return `[${status}] ${message}`
    }
  } catch {
    // 忽略 JSON 解析失败，继续后续分支
  }

  // 2. 检测是否返回了 HTML 页面（如 404 页面、网关错误、反向代理报错）
  const isHtml =
    rawText.includes('<!DOCTYPE') ||
    rawText.includes('<html') ||
    rawText.trim().startsWith('<')

  if (isHtml) {
    switch (status) {
      case 404:
        return `接口地址未找到 (404 Not Found)。请检查 API Base URL (${OPENROUTER_URL}) 是否正确。`
      case 401:
        return '认证未通过 (401 Unauthorized)。请检查 API Key 是否有效。'
      case 403:
        return '访问被拒绝 (403 Forbidden)。请求可能被安全策略或网关拦截。'
      case 429:
        return '请求过于频繁或配额不足 (429 Too Many Requests)。'
      case 502:
      case 503:
      case 504:
        return `上游网关服务异常 (${status})，请检查网络代理设置。`
      default:
        return `服务返回了异常网页 (${status} ${response.statusText})，未能获取有效数据。`
    }
  }

  // 3. 纯文本错误：去除首尾空白并截断过长字符
  const cleanText = rawText.trim()
  if (cleanText) {
    const truncated =
      cleanText.length > 300 ? `${cleanText.slice(0, 300)}...` : cleanText
    return `[${status}] ${truncated}`
  }

  return `请求失败 (${status} ${response.statusText})`
}

export function isOpenRouterConfigured() {
  return Boolean(OPENROUTER_KEY)
}

async function completeChat(
  messages: ChatMessage[],
  signal?: AbortSignal,
  onDelta?: (text: string) => void
) {
  if (!OPENROUTER_KEY) {
    throw new Error(
      '未配置 OpenRouter API Key，请在 .env.development 中设置 VITE_OPENROUTER_API_KEY。'
    )
  }

  const payload: OpenRouterMessage[] = messages
    .filter(
      (message): message is ChatMessage & { role: 'user' | 'assistant' } =>
        message.role === 'user' || message.role === 'assistant'
    )
    .map((message) => ({ role: message.role, content: messageText(message) }))
    .filter((message) => message.content.trim().length > 0)

  const response = await fetch(
    `${OPENROUTER_URL.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': import.meta.env.VITE_APP_TITLE || 'Shadcn Admin',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: payload,
        stream: true,
      }),
    }
  )

  if (!response.ok) {
    const detail = await parseResponseError(response)
    throw new Error(detail)
  }

  if (!response.body) throw new Error('OpenRouter 未返回可读取的流。')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return
    const value = line.slice(5).trim()
    if (!value || value === '[DONE]') return
    try {
      const data = JSON.parse(value) as {
        error?: { message?: string }
        choices?: Array<{ delta?: { content?: string } }>
      }
      if (data.error?.message) {
        throw new Error(data.error.message)
      }
      const delta = data.choices?.[0]?.delta?.content
      if (delta) {
        content += delta
        onDelta?.(delta)
      }
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes('JSON')) {
        throw e
      }
    }
  }
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) consume(line.trim())
    if (done) {
      consume(buffer.trim())
      break
    }
  }
  if (!content) throw new Error('OpenRouter 返回了空消息。')
  return content
}

/**
 * 将 OpenRouter 原生 OpenAI SSE 协议转换为标准 AI SDK ChatTransport 适配器
 */
export function createOpenRouterTransport(): ChatTransport {
  return {
    sendMessages: async ({ messages, abortSignal }) => {
      return createUIMessageStream({
        execute: async ({ writer }) => {
          let started = false
          const textId = crypto.randomUUID()
          try {
            await completeChat(
              messages as ChatMessage[],
              abortSignal,
              (delta) => {
                if (!started) {
                  writer.write({ type: 'start' })
                  writer.write({ type: 'text-start', id: textId })
                  started = true
                }
                writer.write({ type: 'text-delta', id: textId, delta })
              }
            )
            if (started) {
              writer.write({ type: 'text-end', id: textId })
              writer.write({ type: 'finish', finishReason: 'stop' })
            } else {
              writer.write({ type: 'start' })
              writer.write({ type: 'finish', finishReason: 'stop' })
            }
          } catch (cause) {
            const errorText =
              cause instanceof Error ? cause.message : '聊天请求失败'
            writer.write({ type: 'error', errorText })
          }
        },
      })
    },
    reconnectToStream: async () => null,
  }
}

/**
 * 默认导出的 OpenRouter 传输实例（未配置 Key 时回退至离线模拟 Transport）
 */
export const openRouterTransport: ChatTransport = isOpenRouterConfigured()
  ? createOpenRouterTransport()
  : createDemoTransport()
