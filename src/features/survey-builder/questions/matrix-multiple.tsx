import { LayoutGrid } from 'lucide-react'
import { MatrixPanel } from '../components/matrix-panel'
import { MatrixEditor } from '../components/matrix-editor'
import type { QuestionNode } from '../types'
import { defineQuestion } from './index'

/**
 * 3. 导出定义
 */
export const matrixMultipleType = defineQuestion({
  type: 'matrix_multiple',
  meta: {
    label: '矩阵多选',
    description: '多维多选评估',
    icon: LayoutGrid,
    category: '选择类',
  },
  create: () => ({
    type: 'matrix_multiple',
    title: '矩阵多选题',
    required: false,
    config: {
      rows: [{ id: crypto.randomUUID(), label: '行 1' }],
      columns: [
        { id: crypto.randomUUID(), label: '列 1' },
        { id: crypto.randomUUID(), label: '列 2' },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='w-full overflow-hidden'>
        <MatrixEditor
          node={node}
          readonly={true}
          multiple={true}
          onConfigChange={() => {}}
          onNodeChange={() => {}}
        />
      </div>
    )
  },
  configPanel: MatrixPanel,
  editor: (props: any) => <MatrixEditor {...props} multiple={true} />,
  capabilities: {
    valueType: 'array',
    operators: ['is_empty', 'is_not_empty'],
  },
})
