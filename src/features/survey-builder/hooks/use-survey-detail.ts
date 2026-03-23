import { useQuery } from '@tanstack/react-query'
import { surveyBuilderApi } from '../api'

/**
 * 获取问卷详情 Hook
 */
export function useSurveyDetail(id: string) {
  return useQuery({
    queryKey: ['surveys', 'detail', id],
    queryFn: () => surveyBuilderApi.getDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 分钟
  })
}
