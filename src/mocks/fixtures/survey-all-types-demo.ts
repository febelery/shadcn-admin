import { isPresenceConditionOperator } from '@/features/survey/core/logic/operators'
import { createRuleAction } from '@/features/survey/core/logic/rule-utils'
import { getQuestionDefinition } from '@/features/survey/core/question-definitions'
import {
  createEmptySurvey,
  createQuestionId,
  createSection,
  flattenQuestions,
} from '@/features/survey/core/schema-defaults'
import type {
  CascaderNode,
  ChoiceOption,
  QuestionElement,
  RuleActionType,
  RuleConditionOperator,
  QuestionType,
  SurveyElement,
  SurveySchema,
} from '@/features/survey/core/types'

/** 列表中固定的演示问卷 ID，便于从列表点进编辑测试 */
export const DEMO_SURVEY_ID = 'a1111111-1111-4111-8111-111111111111'

const IMG_COVER = 'https://picsum.photos/seed/yunling-hotel-cover/1600/640.jpg'

function opt(label: string, isOther?: boolean): ChoiceOption {
  return {
    id: createQuestionId(),
    label,
    ...(isOther ? { isOther: true } : {}),
  }
}

function cascaderNode(label: string, children?: CascaderNode[]): CascaderNode {
  return {
    id: createQuestionId(),
    label,
    ...(children ? { children } : {}),
  }
}

function q<Type extends QuestionType>(
  type: Type,
  title: string,
  patch?: Partial<QuestionElement<Type>>
): QuestionElement<Type> {
  const base = getQuestionDefinition(type).create()
  return {
    ...base,
    title,
    description: patch?.description,
    required: patch?.required ?? base.required,
    config: { ...base.config, ...patch?.config },
  } as QuestionElement<Type>
}

function divider(): SurveyElement {
  return { kind: 'divider', id: createQuestionId() }
}

/** 生成「云岭精品酒店 · 住客体验调研」——覆盖全部题型，文案按真实业务场景编写 */
export function createAllTypesDemoSurvey(): SurveySchema {
  const survey = createEmptySurvey('云岭精品酒店 · 住客体验调研')
  survey.id = DEMO_SURVEY_ID
  survey.status = 'draft'
  survey.meta.description =
    '感谢您选择云岭精品酒店。本问卷约需 5 分钟，您的反馈将帮助我们持续改进服务。'
  survey.meta.coverType = 'image'
  survey.meta.cover = IMG_COVER
  survey.meta.submitLabel = '提交反馈'
  survey.meta.endTitle = '感谢您的宝贵意见'
  survey.meta.endDescription =
    '您的反馈已收到，期待再次为您服务。退房时可至前台领取一份手冲咖啡券。'

  const demoSections = [
    createSection({
      title: '开始之前',
      description: '请先阅读以下说明',
      elements: [
        {
          kind: 'html_block',
          id: createQuestionId(),
          html: `<p>尊敬的住客，您好！</p>
<p>云岭精品酒店重视每一位客人的真实感受。本问卷用于了解您本次入住的整体体验，<strong>所有信息仅用于服务质量改进</strong>，不会对外公开。</p>
<p>若您愿意留下联系方式，我们将在您下次入住时为您准备一份欢迎礼遇。</p>`,
        },
        divider(),
      ],
    }),

    createSection({
      title: '预订与行程',
      description: '帮助我们了解您的到访背景',
      elements: [
        q('single_choice', '您是通过哪种方式完成本次预订的？', {
          required: true,
          config: {
            options: [
              opt('酒店官网 / App'),
              opt('携程 / 飞猪等 OTA'),
              opt('企业协议 / 差旅平台'),
              opt('朋友推荐 / 社交媒体'),
              opt('其他', true),
            ],
          },
        }),
        q('dropdown', '您本次入住房型是？', {
          config: {
            options: [
              opt('山景大床房'),
              opt('湖景双床房'),
              opt('行政套房'),
              opt('家庭连通房'),
            ],
          },
        }),
        q('cascader', '您的常住地是？', {
          config: {
            cascaderOptions: [
              cascaderNode('中国大陆', [
                cascaderNode('上海'),
                cascaderNode('北京'),
                cascaderNode('深圳'),
                cascaderNode('成都'),
              ]),
              cascaderNode('港澳台', [
                cascaderNode('香港'),
                cascaderNode('澳门'),
                cascaderNode('台北'),
              ]),
              cascaderNode('海外', [
                cascaderNode('新加坡'),
                cascaderNode('东京'),
                cascaderNode('其他'),
              ]),
            ],
          },
        }),
        q('date', '您的入住日期是？', {
          config: { dateMode: 'date' },
        }),
        q('date_range', '若计划再次入住，您偏好的时段是？', {
          config: {
            minDate: '2026-01-01',
            maxDate: '2026-12-31',
          },
        }),
        q('number', '本次连住几晚？', {
          config: { minValue: 1, maxValue: 30, step: 1 },
        }),
      ],
    }),

    createSection({
      title: '店内体验',
      description: '请回忆您在酒店期间的真实感受',
      elements: [
        q('multiple_choice', '本次入住期间，您使用过哪些设施？（可多选）', {
          config: {
            options: [
              opt('自助早餐'),
              opt('健身房 / 泳池'),
              opt('行政酒廊'),
              opt('SPA / 理疗'),
              opt('商务中心'),
              opt('均未使用'),
            ],
            minSelect: 1,
          },
        }),
        q('single_choice', '以下三种早餐主菜，您最想再次品尝的是？', {
          config: {
            options: [
              opt('现煎班尼迪克蛋'),
              opt('本地特色米线'),
              opt('季节水果松饼'),
            ],
          },
        }),
        q('ranking', '请按对您的重要程度，为以下服务维度排序（最重要排最前）', {
          config: {
            options: [
              opt('客房整洁度'),
              opt('前台响应速度'),
              opt('餐饮品质'),
              opt('网络与办公环境'),
              opt('周边交通便利'),
            ],
          },
        }),
        q('matrix_single', '请对下列各项的满意度进行评价', {
          config: {
            rows: [
              { id: createQuestionId(), label: '客房卫生' },
              { id: createQuestionId(), label: '床品舒适度' },
              { id: createQuestionId(), label: '隔音效果' },
              { id: createQuestionId(), label: '员工服务态度' },
            ],
            columns: [
              { id: createQuestionId(), label: '非常不满意' },
              { id: createQuestionId(), label: '不满意' },
              { id: createQuestionId(), label: '一般' },
              { id: createQuestionId(), label: '满意' },
              { id: createQuestionId(), label: '非常满意' },
            ],
          },
        }),
        q('matrix_multiple', '在以下场景中，您使用过哪些服务？（每行可多选）', {
          config: {
            rows: [
              { id: createQuestionId(), label: '抵达当天' },
              { id: createQuestionId(), label: '入住期间' },
              { id: createQuestionId(), label: '退房当天' },
            ],
            columns: [
              { id: createQuestionId(), label: '行李寄存' },
              { id: createQuestionId(), label: '延迟退房' },
              { id: createQuestionId(), label: '叫车服务' },
              { id: createQuestionId(), label: '客房送洗' },
            ],
          },
        }),
        divider(),
        q('rating', '总体而言，您对本次入住体验的评分是？', {
          required: true,
          config: { starCount: 5 },
        }),
        q('slider', '您愿意为「更个性化的服务」额外支付多少比例的费用？', {
          description: '0 表示完全不愿意，100 表示非常愿意',
          config: { minValue: 0, maxValue: 100, step: 5 },
        }),
        q('nps', '您有多大可能向朋友或同事推荐云岭精品酒店？', {
          required: true,
          config: {
            npsLeftLabel: '完全不可能',
            npsRightLabel: '非常可能',
          },
        }),
        q('likert', '请表明您对以下陈述的认同程度', {
          config: {
            statements: [
              {
                id: createQuestionId(),
                label: '酒店环境符合我对「精品」的预期',
              },
              { id: createQuestionId(), label: '员工能主动预判并满足我的需求' },
              { id: createQuestionId(), label: '我会考虑在一年内再次入住' },
            ],
            scaleMin: 1,
            scaleMax: 5,
          },
        }),
      ],
    }),

    createSection({
      title: '联系与详细反馈',
      description: '可选填写，便于我们跟进与改进',
      elements: [
        q('text', '我们应该如何称呼您？', {
          config: { placeholder: '如：张先生 / Ms. Chen', maxLength: 50 },
        }),
        q(
          'fill_in',
          '方便核对账单时，请填写：房号（___），所在楼层（___）',
          {}
        ),
        q('email', '如需发送电子发票或优惠券，请留下邮箱', {
          required: true,
        }),
        q('phone', '如需客服回电，请留下手机号', {
          config: { placeholder: '11 位手机号码' },
        }),
        q('url', '若您在社交平台分享过入住体验，欢迎粘贴链接', {
          config: { placeholder: 'https://...' },
        }),
        q('textarea', '还有哪些细节希望我们改进？', {
          config: {
            placeholder: '例如：早餐品种、枕头硬度、接驳车时刻表……',
            textareaRows: 5,
            maxLength: 1000,
          },
        }),
      ],
    }),

    createSection({
      title: '同行人与其他材料',
      description: '如有同行家人或需要上传凭证，请在此填写',
      elements: [
        q('dynamic_panel', '如有同行家人入住，请填写每位成员信息', {
          config: {
            minItems: 0,
            maxItems: 4,
            addLabel: '添加一位同行人',
            templateElements: [
              q('text', '姓名', {
                config: { placeholder: '与证件一致' },
              }),
              q('dropdown', '与您的关系', {
                config: {
                  options: [
                    opt('配偶 / 伴侣'),
                    opt('子女'),
                    opt('父母'),
                    opt('其他亲属'),
                  ],
                },
              }),
            ],
          },
        }),
        q('file_upload', '如需开具增值税专用发票，请上传营业执照或开票资料', {
          description: '支持 JPG、PNG、PDF，单个文件不超过 10MB',
          config: {
            maxCount: 2,
            maxSize: 10,
            acceptTypes: ['image/*', 'application/pdf'],
          },
        }),
        q('signature', '本人确认以上信息真实有效', {
          required: true,
        }),
      ],
    }),
  ]

  survey.sections = [
    createSection({
      title: '全部题型演示',
      elements: demoSections.flatMap((section) => section.elements),
    }),
  ]

  const questions = flattenQuestions(survey)
  const findQuestion = (text: string) => {
    const item = questions.find((question) => question.title.includes(text))
    if (!item) throw new Error(`Demo survey question not found: ${text}`)
    return item
  }
  const optionId = (question: QuestionElement, text: string) => {
    const item = question.config.options?.find((option) =>
      option.label.includes(text)
    )
    if (!item) throw new Error(`Demo survey option not found: ${text}`)
    return item.id
  }
  const addRule = ({
    name,
    source,
    op,
    value,
    action,
    target,
  }: {
    name: string
    source: QuestionElement
    op: RuleConditionOperator
    value?: string | number
    action: RuleActionType
    target?: QuestionElement
  }) => {
    survey.rules.push({
      id: createQuestionId(),
      name,
      enabled: true,
      priority: survey.rules.length,
      condition: isPresenceConditionOperator(op)
        ? { questionId: source.id, operator: op }
        : { questionId: source.id, operator: op, value: value ?? '' },
      action: createRuleAction(action, target?.id),
    })
  }

  const booking = findQuestion('预订')
  const nights = findQuestion('连住')
  const facilities = findQuestion('设施')
  const breakfast = findQuestion('早餐主菜')
  const rating = findQuestion('入住体验的评分')
  const slider = findQuestion('更个性化的服务')
  const nps = findQuestion('推荐云岭精品酒店')
  const guestName = findQuestion('如何称呼')
  const email = findQuestion('邮箱')
  const phone = findQuestion('手机号')
  const url = findQuestion('社交平台')
  const feedback = findQuestion('哪些细节希望')
  const family = findQuestion('同行家人')

  addRule({
    name: 'OTA 预订跳到设施使用',
    source: booking,
    op: 'eq',
    value: optionId(booking, 'OTA'),
    action: 'jump_to_question',
    target: facilities,
  })
  addRule({
    name: '其他预订渠道收集详细反馈',
    source: booking,
    op: 'eq',
    value: optionId(booking, '其他'),
    action: 'show',
    target: feedback,
  })
  addRule({
    name: '长住客显示同行信息',
    source: nights,
    op: 'gte',
    value: 5,
    action: 'show',
    target: family,
  })
  addRule({
    name: '使用 SPA 时收集改进建议',
    source: facilities,
    op: 'contains',
    value: optionId(facilities, 'SPA'),
    action: 'show',
    target: feedback,
  })
  addRule({
    name: '未使用设施跳到总体评分',
    source: facilities,
    op: 'contains',
    value: optionId(facilities, '均未使用'),
    action: 'jump_to_question',
    target: rating,
  })
  addRule({
    name: '喜欢米线时收集偏好',
    source: breakfast,
    op: 'eq',
    value: optionId(breakfast, '米线'),
    action: 'show',
    target: feedback,
  })
  addRule({
    name: '低评分显示改进建议',
    source: rating,
    op: 'lte',
    value: 2,
    action: 'show',
    target: feedback,
  })
  addRule({
    name: '高服务溢价意愿显示手机号',
    source: slider,
    op: 'gte',
    value: 50,
    action: 'show',
    target: phone,
  })
  addRule({
    name: '低 NPS 显示改进建议',
    source: nps,
    op: 'lte',
    value: 6,
    action: 'show',
    target: feedback,
  })
  addRule({
    name: '已填写称呼显示邮箱',
    source: guestName,
    op: 'not_empty',
    action: 'show',
    target: email,
  })
  addRule({
    name: '已留邮箱显示手机号',
    source: email,
    op: 'not_empty',
    action: 'show',
    target: phone,
  })
  addRule({
    name: '已留手机号显示社交链接',
    source: phone,
    op: 'not_empty',
    action: 'show',
    target: url,
  })
  addRule({
    name: '未留手机号隐藏社交链接',
    source: phone,
    op: 'empty',
    action: 'hide',
    target: url,
  })
  addRule({
    name: '未留邮箱提前结束',
    source: email,
    op: 'empty',
    action: 'end',
  })

  return survey
}
