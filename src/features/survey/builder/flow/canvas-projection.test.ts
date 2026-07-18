import { describe, expect, it } from 'vitest'
import type { QuestionElement, SurveyDocument } from '../../core/types'
import { createFlowCanvasProjection } from './canvas-projection'
import { createFlowProjector } from './projection'

function question(id: string): QuestionElement<'single_choice'> {
  return {
    id,
    kind: 'question',
    type: 'single_choice',
    title: id,
    required: false,
    config: { options: [{ id: `${id}-yes`, label: '是' }] },
  }
}

function document(): SurveyDocument {
  return {
    id: 'survey-1',
    schemaVersion: 2,
    revision: 0,
    status: 'draft',
    meta: {
      title: '流程投影',
      description: '',
      coverType: 'none',
      submitLabel: '提交',
      endTitle: '结束',
      endDescription: '',
    },
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      borderRadius: '0.5rem',
    },
    elements: [question('q1'), question('q2')],
    rules: [
      {
        id: 'jump-rule',
        name: '跳题',
        enabled: true,
        condition: { questionId: 'q1', operator: 'not_empty' },
        action: {
          id: 'jump-action',
          type: 'jump_to_question',
          target: 'q2',
        },
      },
      {
        id: 'visibility-rule',
        name: '隐藏',
        enabled: true,
        condition: { questionId: 'q1', operator: 'not_empty' },
        action: {
          id: 'visibility-action',
          type: 'hide',
          target: 'q2',
        },
      },
    ],
    submissionPolicy: {},
  }
}

describe('flow canvas projection', () => {
  it('adapts domain nodes to typed XYFlow nodes', () => {
    const projection = createFlowCanvasProjection(
      createFlowProjector()(document()),
      { showJump: true, showVisibility: true }
    )
    const questionNode = projection.baseNodes.find(
      (node) => node.data.elementId === 'q1'
    )

    expect(questionNode).toMatchObject({
      type: 'graphNode',
      draggable: false,
      data: {
        kind: 'question',
        questionType: 'single_choice',
      },
    })
  })

  it('applies edge visibility only in the XYFlow adapter', () => {
    const flowProjection = createFlowProjector()(document())
    const hidden = createFlowCanvasProjection(flowProjection, {
      showJump: false,
      showVisibility: false,
    })
    const visible = createFlowCanvasProjection(flowProjection, {
      showJump: true,
      showVisibility: true,
    })

    expect(hidden.edges.every((edge) => edge.data?.kind === 'default')).toBe(
      true
    )
    expect(visible.edges.map((edge) => edge.data?.kind)).toEqual(
      expect.arrayContaining(['default', 'jump', 'visibility'])
    )
  })
})
