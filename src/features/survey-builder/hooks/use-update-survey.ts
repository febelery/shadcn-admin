import { useMutation, useQueryClient } from '@tanstack/react-query'
import { surveyBuilderApi } from '../api'
import type { SurveySchema } from '../types'

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
