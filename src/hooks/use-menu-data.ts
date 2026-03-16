import axios from 'axios'
import { useSuspenseQuery } from '@tanstack/react-query'
import { type MenuData } from '@/types/navigation'

export function useMenuData() {
  const { data } = useSuspenseQuery({
    queryKey: ['menu-data'],
    queryFn: async () => {
      const response = await axios.get<MenuData>('/api/menu')
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return { menuData: data || { navGroups: [] } }
}
