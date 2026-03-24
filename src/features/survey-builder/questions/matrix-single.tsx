import { LayoutGrid } from 'lucide-react'
import { MatrixPanel } from '../components/matrix-panel'
import { MatrixEditor } from '../components/matrix-editor'
import type { QuestionNode } from '../types'
import { defineQuestion } from './index'

/**
 * 3. 导出定义
 */
export const matrixSingleType = defineQuestion({
  type: 'matrix_single',
  meta: {
    label: '矩阵单选',
    description: '表格形式多维评估',
    icon: LayoutGrid,
    category: '选择类',
  },
  create: () => ({
    type: 'matrix_single',
    title: '矩阵单选题',
    required: false,
    config: {
      rows: [
        { id: crypto.randomUUID(), label: '行 1' },
        { id: crypto.randomUUID(), label: '行 2' },
      ],
      columns: [
        { id: crypto.randomUUID(), label: '列 1' },
        { id: crypto.randomUUID(), label: '列 2' },
        { id: crypto.randomUUID(), label: '列 3' },
      ],
    },
  }),
  preview: function Preview({ node }: { node: QuestionNode }) {
    return (
      <div className='w-full overflow-hidden'>
        <MatrixEditor
          node={node}
          readonly={true}
          multiple={false}
          onConfigChange={() => {}}
          onNodeChange={() => {}}
        />
      </div>
    )
  },
  configPanel: MatrixPanel,
  editor: (props: any) => <MatrixEditor {...props} multiple={false} />,
  capabilities: {
    valueType: 'array',
    operators: ['is_empty', 'is_not_empty'],
  },
})
