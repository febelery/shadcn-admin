import { Progress } from '@/components/ui/progress'
import type { RankingAnalysis } from '@/features/survey/core/analysis-types'

type Props = {
  analysis: RankingAnalysis
}

/** 排序题统计：首选比例与实际平均名次分开呈现。 */
export function RankingChart({ analysis }: Props) {
  return (
    <div className='space-y-4'>
      <div className='text-muted-foreground grid grid-cols-[minmax(0,1fr)_7rem_6rem] gap-3 text-xs font-medium'>
        <span>选项</span>
        <span className='text-right'>首选</span>
        <span className='text-right'>平均名次</span>
      </div>
      <div className='space-y-3'>
        {analysis.options.map((option) => (
          <div
            key={option.optionId}
            className='grid grid-cols-[minmax(0,1fr)_7rem_6rem] items-center gap-3'
          >
            <div className='min-w-0 space-y-1'>
              <div className='text-foreground truncate text-sm font-medium'>
                {option.label}
              </div>
              <Progress
                value={option.firstChoicePercentage * 100}
                className='bg-muted/60 h-1.5'
              />
            </div>
            <span className='text-right text-xs'>
              <span className='text-foreground font-mono'>
                {option.firstChoiceCount} 次
              </span>
              <span className='text-muted-foreground ml-1 font-mono'>
                {(option.firstChoicePercentage * 100).toFixed(1)}%
              </span>
            </span>
            <span className='text-muted-foreground text-right font-mono text-xs'>
              {option.averageRank == null ? '-' : option.averageRank.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
