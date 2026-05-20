// edit/context.ts
// ⚠️ 这个文件是向后兼容的过渡层。
// 新代码应直接调用 useBuilderStatic / useBuilderStructure / useBuilderActiveState，
// 不要再使用 useEditContext。
import { useBuilderStatic } from '../context'
import type { BuilderStaticContextType } from '../context'

/** @deprecated 请直接使用 useBuilderStatic() */
export type EditContextType = BuilderStaticContextType

/** @deprecated 请直接使用 useBuilderStatic() */
export function useEditContext() {
  // 直接订阅静态 Context，不再合并三个 context 的结果
  // 这样任何调用 useEditContext() 的组件只会在静态 context 变化时重渲染（几乎永不变化）
  return useBuilderStatic()
}

export {
  useBuilderStatic,
  useBuilderStructure,
  useBuilderActiveState,
} from '../context'
