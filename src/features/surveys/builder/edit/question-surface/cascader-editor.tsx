import { Cascader } from '@/components/ui/cascader'
import type { QuestionElement } from '../../types'
import { useBuilderStatic } from '../../context'

type Props = {
  question: QuestionElement
}

/** 级联题画布：使用 Cascader 组件预览作答区 */
export function SurfaceCascaderEditor({ question }: Props) {
  const { cascaderNodesToOptions } = useBuilderStatic()
  const options = cascaderNodesToOptions(question.config.cascaderOptions ?? [])

  return (
    <Cascader
      options={options}
      placeholder={question.config.placeholder ?? '请选择'}
      disabled
      allowClear={false}
      className='pointer-events-none w-full max-w-sm'
    />
  )
}
