import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { surveyBuilderApi } from './api'
import type { SurveySchema } from './types'

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

/**
 * 更新问卷数据 Hook
 */
export function useUpdateSurvey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SurveySchema> }) =>
      surveyBuilderApi.update(id, data),
    onSuccess: (_, { id }) => {
      // 局部刷新详情，全局刷新列表
      queryClient.invalidateQueries({ queryKey: ['surveys', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['surveys', 'list'] })
    },
  })
}

/**
 * 发布问卷 Hook
 */
export function usePublishSurvey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => surveyBuilderApi.publish(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['surveys', 'detail', id] })
      queryClient.invalidateQueries({ queryKey: ['surveys', 'list'] })
    },
  })
}
