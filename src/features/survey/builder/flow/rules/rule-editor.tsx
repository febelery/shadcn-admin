import { RuleEditorPanel } from '../../edit/logic/rule-editor'
import type { StaticIssue } from '../../types'
import { RuleValidation } from './rule-validation'

type Props = {
  ruleIssues: StaticIssue[]
}

/** 流程右栏 · 规则编辑：校验常驻顶部，规则本身用一句“当/则”完成 */
export function RuleEditorSection({ ruleIssues }: Props) {
  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
      <RuleValidation issues={ruleIssues} compact />
      <RuleEditorPanel className='min-h-0 flex-1' hideHeader hideFooterNote />
    </div>
  )
}
