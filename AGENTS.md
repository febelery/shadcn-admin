# 项目开发约定

## TanStack Form 表单验证

项目中的 TanStack Form 统一使用动态验证策略，避免用户在第一次提交前输入时立即看到错误。

```tsx
import { revalidateLogic, useForm } from '@tanstack/react-form'

const form = useForm({
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: {
    onDynamic: formSchema,
  },
})
```

验证流程必须满足：

1. 第一次提交前，输入和失焦不显示验证错误。
2. 第一次提交时统一验证所有字段。
3. 第一次提交后，字段变化时持续重新验证。
4. 错误只有在字段真正通过验证后才消失。
5. 不要同时为同一个 schema 配置 `onChange`，也不要重复配置 `onSubmit`。

错误展示应基于真实错误，并在首次提交后显示未触碰字段的错误：

```tsx
const isInvalid =
  field.state.meta.errors.length > 0 &&
  (field.state.meta.isTouched || form.state.submissionAttempts > 0)
```

使用 shadcn/ui 表单组件时，将 `data-invalid` 设置在 `Field` 上，将 `aria-invalid` 设置在实际表单控件上。
