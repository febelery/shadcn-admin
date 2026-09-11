import { createContext, useContext, type ReactNode } from 'react'

/**
 * 标准上传函数签名（全站通用协议抽象）
 */
export type UploadFn = (
  file: File,
  options?: { onProgress?: (progress: number) => void }
) => Promise<string>

const UploadContext = createContext<UploadFn | null>(null)

export interface UploadProviderProps {
  upload?: UploadFn | null
  children: ReactNode
}

/**
 * 全局文件上传能力容器（Composition Root Seam）
 *
 * 在 main.tsx 组合根处统一注入具体存储适配器（如 qiniuUpload、s3Upload 或测试 Fake），
 * 使所有 UI 消费者（FileUpload 组件、Editor 编辑器等）仅依赖抽象上下文，消除组件间横向耦合。
 */
export function UploadProvider({ upload, children }: UploadProviderProps) {
  return (
    <UploadContext.Provider value={upload ?? null}>
      {children}
    </UploadContext.Provider>
  )
}

/**
 * 供任何需要上传能力的模块（FileUpload、Editor 等）消费全局注入的上传适配器
 */
export function useUpload(): UploadFn | null {
  return useContext(UploadContext)
}
