import { useShallow } from 'zustand/react/shallow'
import { isQuestionNode, type QuestionNode } from '../types'
import { useBuilderStore } from './index'

/**
 * 获取当前选中的完整节点对象
 */
export const useSelectedNode = () => {
  const nodes = useBuilderStore((s) => s.nodes)
  const id = useBuilderStore((s) => s.selectedNodeId)
  return nodes.find((n) => n.id === id) ?? null
}

/**
 * 获取排序后的根节点列表 (用于画布主渲染)
 */
export const useRootNodes = () =>
  useBuilderStore(
    useShallow((s) => [...(s.nodes ?? [])].sort((a, b) => a.order - b.order))
  )

/**
 * 获取所有可见题目的编号映射
 * 用于 SurveyHeader 等地方展示 "共 X 题"
 */
export const useVisibleNodeNumber = () =>
  useBuilderStore(
    useShallow((s) => {
      const numMap: Record<string, number> = {}
      let i = 0
      ;[...(s.nodes ?? [])]
        .filter((n: QuestionNode) => isQuestionNode(n.type))
        .sort((a, b) => a.order - b.order)
        .forEach((n: QuestionNode) => {
          i++
          numMap[n.id] = i
        })
      return numMap
    })
  )

/**
 * 衍生状态：当前是否处于某种模式
 */
export const useIsBuilderMode = (mode: 'build' | 'flow') =>
  useBuilderStore((s) => s.builderMode === mode)
