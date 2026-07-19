import { describe, expect, it } from 'vitest'
import { createEmptySurvey } from '../core/document-factory'
import { parseSurveyDocument } from '../core/document-schema'
import {
  applySurveySettingsValues,
  documentToSurveySettingsValues,
  surveySettingsFormSchema,
} from './form-schema'

describe('survey settings form schema', () => {
  it('maps every settings field to a valid survey document', () => {
    const source = createEmptySurvey('初始标题')
    const values = {
      ...documentToSurveySettingsValues(source),
      title: '新版问卷',
      description: '问卷说明',
      coverType: 'image' as const,
      cover: 'https://example.com/cover.jpg',
      submitLabel: '确认提交',
      opensAt: new Date('2026-07-19T08:00:00.000Z'),
      closesAt: new Date('2026-07-20T08:00:00.000Z'),
      endTitle: '提交成功',
      endDescription: '感谢参与',
      totalLimit: '100',
      perUserLimit: '2',
      dailyPerUserLimit: '1',
      dailyLimit: '50',
      perDeviceLimit: '3',
      accessPassword: 'survey-pass',
      numberingStyle: 'chinese' as const,
      numberingMode: 'continuous' as const,
      primaryColor: '#2563eb',
    }

    const parsedValues = surveySettingsFormSchema.parse(values)
    const document = parseSurveyDocument(
      applySurveySettingsValues(source, parsedValues)
    )

    expect(document).toMatchObject({
      meta: {
        title: '新版问卷',
        description: '问卷说明',
        coverType: 'image',
        cover: 'https://example.com/cover.jpg',
        submitLabel: '确认提交',
        endTitle: '提交成功',
        endDescription: '感谢参与',
        defaultQuestionNumbering: 'chinese',
        questionNumberingMode: 'continuous',
      },
      theme: { primaryColor: '#2563eb' },
      submissionPolicy: {
        opensAt: '2026-07-19T08:00:00.000Z',
        closesAt: '2026-07-20T08:00:00.000Z',
        totalLimit: 100,
        perUserLimit: 2,
        dailyPerUserLimit: 1,
        dailyLimit: 50,
        perDeviceLimit: 3,
        accessPassword: 'survey-pass',
      },
    })
  })

  it('removes optional policy fields when inputs are cleared', () => {
    const source = createEmptySurvey()
    source.submissionPolicy = {
      totalLimit: 20,
      opensAt: '2026-07-19T08:00:00.000Z',
      accessPassword: 'secret',
    }
    const values = documentToSurveySettingsValues(source)
    values.totalLimit = ''
    values.opensAt = undefined
    values.accessPassword = ''

    expect(applySurveySettingsValues(source, values).submissionPolicy).toEqual(
      {}
    )
  })

  it('reports field-level validation errors', () => {
    const values = documentToSurveySettingsValues(createEmptySurvey())

    expect(
      surveySettingsFormSchema.safeParse({ ...values, title: ' ' }).error
        ?.issues[0]
    ).toMatchObject({ path: ['title'], message: '请输入问卷标题' })
    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        coverType: 'image',
        cover: '',
      }).error?.issues[0]
    ).toMatchObject({ path: ['cover'] })
    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        perUserLimit: '1.5',
      }).error?.issues[0]
    ).toMatchObject({ path: ['perUserLimit'] })

    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        coverType: 'none',
        cover: 'legacy-storage-key',
      }).success
    ).toBe(true)
  })

  it('rejects an end time earlier than the start time', () => {
    const values = documentToSurveySettingsValues(createEmptySurvey())
    const result = surveySettingsFormSchema.safeParse({
      ...values,
      opensAt: new Date('2026-07-20T08:00:00.000Z'),
      closesAt: new Date('2026-07-19T08:00:00.000Z'),
    })

    expect(result.error?.issues[0]).toMatchObject({
      path: ['closesAt'],
      message: '结束时间不能早于开始时间',
    })
  })

  it('accepts three and six digit shadcn-compatible colors', () => {
    const values = documentToSurveySettingsValues(createEmptySurvey())

    expect(
      surveySettingsFormSchema.safeParse({ ...values, primaryColor: '#000' })
        .success
    ).toBe(true)
    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        primaryColor: '#2563eb',
      }).success
    ).toBe(true)

    expect(
      documentToSurveySettingsValues({
        ...createEmptySurvey(),
        theme: {
          ...createEmptySurvey().theme,
          primaryColor: '#abc',
        },
      }).primaryColor
    ).toBe('#aabbcc')
  })
})
