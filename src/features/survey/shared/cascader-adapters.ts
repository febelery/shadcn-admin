import type { CascaderOption } from '@/components/ui/cascader'
import type { CascaderNode } from '../core/types'

/** 问卷节点 → Cascader 组件选项（组件 value 使用节点 id） */
export function cascaderNodesToOptions(
  nodes: CascaderNode[]
): CascaderOption[] {
  return nodes.map((node) => ({
    value: node.id,
    label: node.label,
    textLabel: node.label,
    children: node.children?.length
      ? cascaderNodesToOptions(node.children)
      : undefined,
  }))
}

/** 创建新级联节点 */
export function createCascaderNode(label: string): CascaderNode {
  return { id: crypto.randomUUID(), label }
}

/** 深拷贝级联树并重新生成 id（复制题目时使用） */
export function cloneCascaderNodes(nodes: CascaderNode[]): CascaderNode[] {
  return nodes.map((node) => ({
    ...node,
    id: crypto.randomUUID(),
    children: node.children?.length
      ? cloneCascaderNodes(node.children)
      : undefined,
  }))
}

export function updateCascaderNode(
  nodes: CascaderNode[],
  id: string,
  patch: Partial<Pick<CascaderNode, 'label'>>
): CascaderNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...patch }
    if (node.children) {
      return {
        ...node,
        children: updateCascaderNode(node.children, id, patch),
      }
    }
    return node
  })
}

export function removeCascaderNode(
  nodes: CascaderNode[],
  id: string
): CascaderNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeCascaderNode(node.children, id) }
        : node
    )
}

export function addCascaderChild(
  nodes: CascaderNode[],
  parentId: string,
  child: CascaderNode
): CascaderNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children ?? []), child] }
    }
    if (node.children) {
      return {
        ...node,
        children: addCascaderChild(node.children, parentId, child),
      }
    }
    return node
  })
}
