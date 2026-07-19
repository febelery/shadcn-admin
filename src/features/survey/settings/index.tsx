import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout } from '@/components/layout/page-layout'
import { createEmptySurvey } from '../core/document-factory'
import { useSurveyDetail } from '../query/hooks'
import { SurveySettingsForm } from './survey-settings-form'

export function SurveySettingsPage({ surveyId }: { surveyId: string }) {
  const detail = useSurveyDetail(surveyId)
  if (detail.isLoading) return <SettingsLoadingState />
  if (detail.isError || !detail.data) return <SettingsErrorState />
  return (
    <SurveySettingsForm
      mode='edit'
      surveyId={surveyId}
      initialDocument={detail.data}
    />
  )
}

export function NewSurveySettingsPage() {
  const [initialDocument] = useState(createEmptySurvey)
  return <SurveySettingsForm mode='create' initialDocument={initialDocument} />
}

function SettingsLoadingState() {
  return (
    <PageLayout variant='default' title='问卷设置' description='正在加载…'>
      <div className='space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-96 w-full' />
      </div>
    </PageLayout>
  )
}

function SettingsErrorState() {
  return (
    <PageLayout title='问卷设置' description='加载失败。'>
      <p className='text-muted-foreground text-sm'>请返回列表重试。</p>
    </PageLayout>
  )
}
