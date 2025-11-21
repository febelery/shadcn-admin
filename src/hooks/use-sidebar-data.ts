import { useQuery } from '@tanstack/react-query'
import { type SidebarData } from '@/types/navigation'
import axios from 'axios'

export function useSidebarData() {
  const { data, isLoading } = useQuery({
    queryKey: ['sidebar-data'],
    queryFn: async () => {
      const response = await axios.get<SidebarData>('/api/sidebar')
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return { sidebarData: data || { navGroups: [] }, isLoading }
}
