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

      <div className='border-muted/70 bg-background/50 overflow-x-auto rounded-xl border backdrop-blur-sm'>
        <table className='w-full min-w-[600px] border-collapse text-left text-sm'>
          <thead>
            <tr className='bg-muted/20 text-muted-foreground border-b text-xs font-semibold'>
              <th className='text-foreground/80 w-1/4 p-3.5 pl-5 font-semibold'>
                维度 / 子题
              </th>
              {cols.map((col, idx) => (
                <th
                  key={idx}
                  className='text-foreground/80 p-3.5 text-center font-semibold'
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y'>
            {analysis.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className='hover:bg-muted/5 transition-colors'>
                <td className='text-foreground p-3.5 pl-5 font-medium'>
                  {row.rowLabel}
                </td>
                {row.columns.map((colVal, colIdx) => {
                  // Calculate opacity based on percentage (0 to 1)
                  const percent = colVal.percentage * 100
                  const bgStyle =
                    percent > 0
                      ? {
                          backgroundColor: `hsla(var(--primary), ${Math.max(0.03, colVal.percentage * 0.4)})`,
                          color:
                            percent > 40 ? 'hsl(var(--primary))' : 'inherit',
                        }
                      : {}

                  return (
                    <td
                      key={colIdx}
                      style={bgStyle}
                      className='p-3.5 text-center font-mono transition-all duration-300'
                    >
                      <div className='text-foreground/90 text-xs font-semibold'>
                        {colVal.count} 人
                      </div>
                      <div className='text-muted-foreground/80 mt-0.5 text-[10px]'>
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
