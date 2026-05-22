import type { LikertAnalysis } from '@/features/survey/core/analysis-types'

interface LikertChartProps {
  analysis: LikertAnalysis
}

export function LikertChart({ analysis }: LikertChartProps) {
  // Colors for scores (assuming 1-5 scale)
  const scoreColors = [
    'bg-rose-500/80',    // 1 - Strongly Disagree
    'bg-orange-400/80',  // 2 - Disagree
    'bg-amber-300/80',   // 3 - Neutral
    'bg-emerald-400/80', // 4 - Agree
    'bg-teal-500/85',    // 5 - Strongly Agree
  ]

  return (
    <div className='space-y-6'>
      <div className='text-muted-foreground text-xs font-medium'>
        各陈述陈词认同度分布对比（颜色依次：非常不同意 {'->'} 非常同意）
      </div>

      <div className='space-y-5'>
        {analysis.statements.map((stmt, stmtIdx) => (
          <div key={stmtIdx} className='border rounded-xl p-4 bg-muted/5 space-y-3.5'>
            <div className='font-medium text-sm text-foreground'>{stmt.statementLabel}</div>

            {/* Stacked indicator bar representing distribution */}
            <div className='h-3 flex rounded-full overflow-hidden bg-muted/40'>
              {stmt.distribution.map((dist, idx) => {
                const percentage = dist.percentage * 100
                if (percentage === 0) return null
                return (
                  <div
                    key={idx}
                    style={{ width: `${percentage}%` }}
                    className={`h-full ${scoreColors[idx % scoreColors.length] || 'bg-primary/50'} transition-all`}
                    title={`${dist.score}分: ${dist.count}人 (${percentage.toFixed(0)}%)`}
                  />
                );
              })}
            </div>

            {/* Details list */}
            <div className='flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground'>
              {stmt.distribution.map((dist, idx) => (
                <div key={idx} className='flex items-center gap-1.5'>
                  <span className={`h-2.5 w-2.5 rounded ${scoreColors[idx % scoreColors.length] || 'bg-primary/50'}`} />
                  <span className='font-medium text-foreground'>{dist.score}分</span>
                  <span className='font-mono'>
                    {dist.count}人 ({(dist.percentage * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
