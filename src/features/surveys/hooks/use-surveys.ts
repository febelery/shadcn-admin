import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { surveysApi } from '../api/surveys-api'
import { toast } from 'sonner'

export function useSurveys(params: any = {}) {
  return useQuery({
    queryKey: ['surveys', params],
    queryFn: () => surveysApi.list(params),
  })
}

export function useCreateSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => surveysApi.create(title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] })
    },
    onError: () => toast.error('创建失败'),
  })
}

export function useDeleteSurvey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => surveysApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] })
      toast.success('已删除')
    },
    onError: () => toast.error('删除失败'),
  })
}

export function useUpdateSurveyStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      surveysApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surveys'] })
    },
  })
}
