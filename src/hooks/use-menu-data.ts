import { useQuery } from '@tanstack/react-query'
import { type MenuData } from '@/types/navigation'
import axios from 'axios'

export function useMenuData() {
  const { data, isLoading } = useQuery({
    queryKey: ['menu-data'],
    queryFn: async () => {
      const response = await axios.get<MenuData>('/api/menu')
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return { menuData: data || { navGroups: [] }, isLoading }
}

