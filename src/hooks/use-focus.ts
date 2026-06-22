'use client'
import { useState, useCallback } from 'react'

/**
 * 焦点管理 Hook
 */
export function useFocus() {
  const [focusId, setFocusId] = useState<string | null>(null)

  const requestFocus = useCallback((id: string | null) => {
    // 置空强制触发 Effect (如果 ID 相同也能重排焦点的鲁棒性策略)
    setFocusId(null)
    // 延迟一个渲染帧确保组件已经处于正确的数据状态
    requestAnimationFrame(() => {
      setFocusId(id)
    })
  }, [])

  return [focusId, requestFocus] as const
}
