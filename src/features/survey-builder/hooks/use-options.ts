import { useBuilderStore } from '../store'
import type { ChoiceOption } from '../types'

/**
 * 最小化选项管理 Hook
 * 处理通用的 options 增、删、改逻辑，解耦业务 UI 逻辑。
 */
export const useOptions = (nodeId: string, options: ChoiceOption[]) => {
  const updateNodeConfig = useBuilderStore((s) => s.updateNodeConfig)

  // 新增选项 (追加到底部)
  const add = () => {
    const id = crypto.randomUUID()
    const newOpt: ChoiceOption = {
      id,
      label: '',
      value: `opt_${id.slice(0, 8)}`,
      order: options.length,
    }
    updateNodeConfig(nodeId, { options: [...options, newOpt] })
  }

  // 删除指定 ID 的选项 (保留至少一个)
  const remove = (id: string) => {
    if (options.length <= 1) return
    updateNodeConfig(nodeId, { options: options.filter((o) => o.id !== id) })
  }

  // 更新指定选项的 Label
  const update = (id: string, label: string) => {
    updateNodeConfig(nodeId, {
      options: options.map((o) => (o.id === id ? { ...o, label } : o)),
    })
  }

  return { add, remove, update }
}
