import { Link } from '@tanstack/react-router'
import { ArrowLeft, Download } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { flattenQuestions } from '../core/schema-defaults'
import type { QuestionElement, SurveyResponseItem } from '../core/types'
import {
  useExportSurveyExcel,
  useSurveyDetail,
  useSurveyResponse,
  useSurveyStats,
} from '../query/hooks'

type Props = { surveyId: string }

function getAnswerValues(answer: unknown): string[] {
  if (Array.isArray(answer)) {
    return answer
      .filter((item): item is string | number | boolean =>
        ['string', 'number', 'boolean'].includes(typeof item)
      )
      .map(String)
  }
  if (
    typeof answer === 'string' ||
    typeof answer === 'number' ||
    typeof answer === 'boolean'
  ) {
    return [String(answer)]
  }
  return []
}

function buildOptionDistribution(
  question: QuestionElement | undefined,
  responses: SurveyResponseItem[]
) {
  const options = question?.config.options ?? []
  const counts = new Map(options.map((option) => [option.id, 0]))

  for (const item of responses) {
    const values = getAnswerValues(item.answers[question?.id ?? ''])
    for (const value of values) {
      const option = options.find(
        (item) => item.id === value || item.label === value
      )
      if (!option) continue
      counts.set(option.id, (counts.get(option.id) ?? 0) + 1)
    }
  }

  return options.map((option) => ({
    name: option.label,
    count: counts.get(option.id) ?? 0,
  }))
}

export function SurveyAnalyticsPage({ surveyId }: Props) {
  const { data: schema } = useSurveyDetail(surveyId)
  const { data: stats } = useSurveyStats(surveyId)
  const { data: responses } = useSurveyResponse(surveyId, {
    page: 1,
    pageSize: 10,
  })
  const { data: distributionResponses } = useSurveyResponse(surveyId, {
    page: 1,
    pageSize: 1000,
  })
  const { mutate: exportExcel, isPending: exporting } = useExportSurveyExcel()

  const questions = schema ? flattenQuestions(schema) : []
  const firstChoice = questions.find((q) => q.config.options?.length)
  const chartData = buildOptionDistribution(
    firstChoice,
    distributionResponses?.data ?? []
  )

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/survey'>
            <ArrowLeft className='h-4 w-4' />
          </Link>
        </Button>
        <div className='flex-1'>
          <h1 className='text-2xl font-semibold'>
            {schema?.meta.title ?? 'Analytics'}
          </h1>
          <p className='text-muted-foreground text-sm'>Response overview</p>
        </div>
        <Button
          variant='outline'
          disabled={exporting}
          onClick={() => exportExcel(surveyId)}
        >
          <Download className='mr-2 h-4 w-4' />
          Export Excel
        </Button>
      </div>

      {stats && (
        <div className='grid gap-4 sm:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Views</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-bold'>
              {stats.views}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Starts</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-bold'>
              {stats.starts}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Completions</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-bold'>
              {stats.completions}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm'>Completion rate</CardTitle>
            </CardHeader>
            <CardContent className='text-2xl font-bold'>
              {Math.round(stats.completionRate * 100)}%
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              {firstChoice?.title ?? 'Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className='h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey='count' fill='var(--color-primary)' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Recent responses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(responses?.data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-mono text-xs'>
                    {r.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>
                    {new Date(r.startedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
