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
        cover: 'legacy-storage-key',
      }).error?.issues[0]
    ).toMatchObject({ path: ['cover'] })
    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        perUserLimit: '1.5',
      }).error?.issues[0]
    ).toMatchObject({ path: ['perUserLimit'] })

    // 头图只有图片一种：留空即不保存 cover
    const noCover = applySurveySettingsValues(
      createEmptySurvey(),
      surveySettingsFormSchema.parse({ ...values, cover: '' })
    )
    expect(noCover.meta.cover).toBeUndefined()
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

  it('rejects invalid or non-image URLs via checkImageAccessible', async () => {
    const { checkImageAccessible } = await import('@/lib/files')
    expect(await checkImageAccessible('')).toBe(false)
    expect(await checkImageAccessible('not-a-url')).toBe(false)
    expect(await checkImageAccessible('ftp://example.com/a.png')).toBe(false)
  })

  it('defaults new surveys to one submission per user and keeps unexposed policy fields', () => {
    const source = createEmptySurvey()
    expect(source.submissionPolicy).toEqual({ perUserLimit: 1 })
    expect(documentToSurveySettingsValues(source).perUserLimit).toBe('1')

    source.submissionPolicy = { perUserLimit: 1, perDeviceLimit: 2 }
    const next = applySurveySettingsValues(
      source,
      documentToSurveySettingsValues(source)
    )
    expect(next.submissionPolicy.perDeviceLimit).toBe(2)
  })

  it('round-trips the consent gate and drops it when switched off', () => {
    const source = createEmptySurvey()
    const values = documentToSurveySettingsValues(source)

    expect(values.consentEnabled).toBe(false)
    expect(values.consentReadSeconds).toBe('3')

    const enabled = applySurveySettingsValues(source, {
      ...values,
      consentEnabled: true,
      consentClauses: [
        {
          id: 'privacy',
          title: ' 隐私政策 ',
          content: '<p>正文</p>',
          optional: false,
        },
        {
          id: 'marketing',
          title: '营销授权',
          content: '<p>选填</p>',
          optional: true,
        },
      ],
      consentReadSeconds: '15',
      consentRequireScroll: true,
      consentCheckboxLabel: ' 我同意 ',
      consentDenyMessage: '',
    })

    expect(enabled.submissionPolicy.consent).toEqual({
      clauses: [
        { id: 'privacy', title: '隐私政策', content: '<p>正文</p>' },
        {
          id: 'marketing',
          title: '营销授权',
          content: '<p>选填</p>',
          optional: true,
        },
      ],
      minReadSeconds: 15,
      requireScrollToEnd: true,
      checkboxLabel: '我同意',
    })
    expect(
      parseSurveyDocument(enabled).submissionPolicy.consent?.clauses
    ).toHaveLength(2)

    const disabled = applySurveySettingsValues(enabled, {
      ...documentToSurveySettingsValues(enabled),
      consentEnabled: false,
    })
    expect('consent' in disabled.submissionPolicy).toBe(false)

    const cleared = applySurveySettingsValues(enabled, {
      ...documentToSurveySettingsValues(enabled),
      consentReadSeconds: '',
      consentRequireScroll: false,
    })
    expect(cleared.submissionPolicy.consent).toEqual({
      clauses: [
        { id: 'privacy', title: '隐私政策', content: '<p>正文</p>' },
        {
          id: 'marketing',
          title: '营销授权',
          content: '<p>选填</p>',
          optional: true,
        },
      ],
      checkboxLabel: '我同意',
    })
  })

  it('reports consent field errors without forcing a timer', () => {
    const values = documentToSurveySettingsValues(createEmptySurvey())

    const emptyClause = surveySettingsFormSchema.safeParse({
      ...values,
      consentEnabled: true,
      consentClauses: [
        { id: 'c1', title: ' ', content: '<p></p>', optional: false },
      ],
    })
    expect(emptyClause.success).toBe(false)
    expect(emptyClause.error?.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        ['consentClauses', 0, 'title'],
        ['consentClauses', 0, 'content'],
      ])
    )

    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        consentEnabled: true,
        consentReadSeconds: '0',
      }).error?.issues[0]
    ).toMatchObject({ path: ['consentReadSeconds'] })

    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        consentEnabled: true,
        consentReadSeconds: '601',
      }).error?.issues[0]
    ).toMatchObject({ path: ['consentReadSeconds'] })

    expect(
      surveySettingsFormSchema.safeParse({
        ...values,
        consentEnabled: false,
        consentClauses: [],
        consentReadSeconds: '',
      }).success
    ).toBe(true)
  })
})
