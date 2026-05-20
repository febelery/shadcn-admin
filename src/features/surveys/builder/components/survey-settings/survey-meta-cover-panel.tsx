import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_META } from '../../../core/schema-defaults'
import { useBuilderStore } from '../../store'
import { builderTypeMicro } from '../../ui'
import { MediaUrlField } from '../media-url-field'
import {
  InspectorColorField,
  InspectorFormField,
  InspectorSection,
} from '../inspector-primitives'

export function SurveyMetaCoverPanel() {
  const meta = useBuilderStore((s) => s.schema!.meta)

  return (
    <InspectorSection title='头图与展示' description='封面、说明与提交按钮'>
      <InspectorFormField label='头图样式'>
        <Tabs
          value={meta.coverType}
          onValueChange={(v) =>
            useBuilderStore.getState().updateMeta({
              coverType: v as typeof meta.coverType,
            })
          }
        >
          <TabsList className='grid h-8 w-full grid-cols-3'>
            <TabsTrigger value='none' className={cn('px-2', builderTypeMicro)}>
              无头图
            </TabsTrigger>
            <TabsTrigger value='color' className={cn('px-2', builderTypeMicro)}>
              纯色头图
            </TabsTrigger>
            <TabsTrigger value='image' className={cn('px-2', builderTypeMicro)}>
              图片头图
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </InspectorFormField>

      {meta.coverType === 'color' ? (
        <InspectorFormField label='头图背景色'>
          <InspectorColorField
            value={meta.coverColor ?? DEFAULT_META.coverColor}
            onValueChange={(coverColor) =>
              useBuilderStore.getState().updateMeta({ coverColor })
            }
          />
        </InspectorFormField>
      ) : null}

      {meta.coverType === 'image' ? (
        <InspectorFormField
          label='头图图片'
          hint='上传或粘贴图片链接，保存前会校验地址'
        >
          <MediaUrlField
            value={meta.cover ?? ''}
            onChange={(cover) =>
              useBuilderStore.getState().updateMeta({ cover })
            }
            crop
            aspect={2}
          />
        </InspectorFormField>
      ) : null}

      <InspectorFormField label='问卷说明' htmlFor='survey-desc'>
        <Textarea
          id='survey-desc'
          rows={3}
          value={meta.description}
          onChange={(e) =>
            useBuilderStore.getState().updateMeta({ description: e.target.value })
          }
        />
      </InspectorFormField>

      <InspectorFormField label='提交按钮文案' htmlFor='submit-label'>
        <Input
          id='submit-label'
          className='h-9'
          value={meta.submitLabel}
          onChange={(e) =>
            useBuilderStore.getState().updateMeta({ submitLabel: e.target.value })
          }
        />
      </InspectorFormField>
    </InspectorSection>
  )
}
