import React from 'react'
import type { MatrixAnalysis } from '@/features/survey/core/analysis-types'

interface MatrixChartProps {
  analysis: MatrixAnalysis
}

export function MatrixChart({ analysis }: MatrixChartProps) {
  // Get all columns from first row to build header
  const cols = React.useMemo(() => {
    if (!analysis.rows || analysis.rows.length === 0) return []
    return analysis.rows[0].columns.map((c) => c.columnLabel)
  }, [analysis.rows])

  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground text-xs font-medium'>
        矩阵维度得分热力分布（格内数据为：选择人数 / 占比百分比）
      </div>

      <div className='overflow-x-auto rounded-xl border border-muted/70 bg-background/50 backdrop-blur-sm'>
        <table className='w-full min-w-[600px] border-collapse text-sm text-left'>
          <thead>
            <tr className='border-b bg-muted/20 text-xs text-muted-foreground font-semibold'>
              <th className='p-3.5 pl-5 font-semibold text-foreground/80 w-1/4'>维度 / 子题</th>
              {cols.map((col, idx) => (
                <th key={idx} className='p-3.5 font-semibold text-foreground/80 text-center'>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y'>
            {analysis.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className='hover:bg-muted/5 transition-colors'>
                <td className='p-3.5 pl-5 font-medium text-foreground'>{row.rowLabel}</td>
                {row.columns.map((colVal, colIdx) => {
                  // Calculate opacity based on percentage (0 to 1)
                  const percent = colVal.percentage * 100
                  const bgStyle =
                    percent > 0
                      ? {
                          backgroundColor: `hsla(var(--primary), ${Math.max(0.03, colVal.percentage * 0.4)})`,
                          color: percent > 40 ? 'hsl(var(--primary))' : 'inherit',
                        }
                      : {}

                  return (
                    <td
                      key={colIdx}
                      style={bgStyle}
                      className='p-3.5 text-center font-mono transition-all duration-300'
                    >
                      <div className='font-semibold text-xs text-foreground/90'>{colVal.count} 人</div>
                      <div className='text-[10px] text-muted-foreground/80 mt-0.5'>
                        {percent.toFixed(0)}%
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
