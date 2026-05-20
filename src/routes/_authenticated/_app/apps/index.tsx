import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Apps } from '@/features/apps'
import { requirePermission } from '@/lib/auth-guard'

const appsSearchSchema = z.object({
  type: z
    .enum(['all', 'connected', 'notConnected'])
    .optional()
    .catch(undefined),
  filter: z.string().optional().catch(''),
  sort: z.enum(['asc', 'desc']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/_app/apps/')({
  beforeLoad: requirePermission('apps:access'),
  validateSearch: appsSearchSchema,
  component: Apps,
})
