# TanStack Form / shadcn 表单验证审计

审计日期：2026-09-09  
范围：`src/features/**` 与使用 `useForm` 的组件；本报告只记录结论，不修改业务代码。

## 结论摘要

项目当前使用 `@tanstack/react-form@1.33.5`、Zod 4，并已将主要业务表单迁移到 `revalidateLogic()` + `validators.onDynamic`。这与 TanStack Form 当前文档推荐的动态验证模型一致，且默认交互正好满足本项目约定：首次提交前不按输入验证，首次提交统一验证，提交后按 change 重新验证。

但“验证策略正确”不等于“所有表单都已达到最佳实践”。仍有以下改进项：

1. 多个表单使用 `className="space-y-*"` 作为布局；项目 shadcn 约定要求使用 `FieldGroup`/`Field` 与 `gap-*`。
2. 多数提交按钮没有订阅 `form.state.isSubmitting` 或 `form.state.canSubmit`，而是直接提交；异步提交时存在重复点击风险，且按钮 loading 状态不统一。
3. 登录、注册等表单把请求包在 React `startTransition` 中，但 `onSubmit` 没有 `await` 该请求。TanStack 文档明确要求在 `onSubmit` 中 await 异步操作，否则 `isSubmitting` 会过早恢复为 `false`。
4. `revalidateLogic()` 的默认值是 `mode: 'submit'`、`modeAfterSubmission: 'change'`。当前行为正确，但建议在项目模板/核心示例中显式写出两个 mode，避免未来升级或维护者误读。
5. 服务端/业务 API 错误尚未统一映射到 `onSubmit`/`onSubmitAsync` 的 form-level 与 field-level error。TanStack 支持 `{ form, fields }` 结构，建议在真实 API 表单中采用。

## 官方文档核对

### 动态验证与重新验证

官方 Dynamic Validation：
<https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation>

- `onDynamic` 默认不会执行，必须配置 `validationLogic: revalidateLogic()`。
- `revalidateLogic` 的 `mode` 控制首次提交前行为：`change`、`blur` 或 `submit`，默认是 `submit`。
- `modeAfterSubmission` 控制提交后行为，默认是 `change`。
- 因此项目目标可明确写成：

  ```tsx
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: { onDynamic: formSchema },
  ```

- 动态验证也可以用于字段级 `form.Field.validators.onDynamic`；异步场景使用 `onDynamicAsync`，并可配合 `onDynamicAsyncDebounceMs`。
- `onDynamic` 可以与 `onChange`/`onBlur` 并存，但它们代表不同验证时机。对同一 Zod schema 不应重复挂载多个时机。

### 字段级、表单级与服务端错误

官方 Validation：
<https://tanstack.com/form/latest/docs/framework/react/guides/validation>

- 字段级 validator 适合单字段规则；表单级 validator 适合跨字段约束（例如确认密码）及整个值对象校验。
- 错误可从 `field.state.meta.errors` 或按时机从 `field.state.meta.errorMap` 读取；表单级错误可从 `form.state.errorMap` 读取。
- 服务端验证推荐在 `validators.onSubmitAsync` 中执行，并返回：

  ```ts
  {
    form: 'Invalid data',
    fields: {
      email: '邮箱已存在',
      'items[0].url': 'URL 无效',
    },
  }
  ```

这比只显示 toast 更容易把错误关联到可修复的控件。

### 提交状态

TanStack `FormApi` 状态包括 `canSubmit`、`isSubmitting`、`isSubmitted`、`isValidating`、`submissionAttempts` 和 `isSubmitSuccessful`。提交会递增 `submissionAttempts`；验证失败不会进入 `onSubmit`。

官方 API 源码/类型（当前安装版本）：
<https://github.com/TanStack/form/blob/main/packages/form-core/src/FormApi.ts>

官方示例使用 `form.Subscribe` 订阅 `state.canSubmit` 与 `state.isSubmitting`，将提交按钮禁用和 loading 与 TanStack 状态绑定。异步 `onSubmit` 必须 `await` 请求，才能让 `isSubmitting` 覆盖完整请求生命周期。

## shadcn/ui 对照

官方 Field 文档：
<https://ui.shadcn.com/docs/components/radix/field>

官方表单示例（虽然示例使用 React Hook Form，Field 的无障碍约定同样适用于 TanStack Form）：
<https://ui.shadcn.com/docs/forms/react-hook-form>

shadcn 也提供了专门的 TanStack Form 示例：
<https://ui.shadcn.com/docs/forms/tanstack-form>

该示例使用 `validators.onSubmit: formSchema`，并明确把动态验证策略留给 TanStack 官方文档。它适合作为最小提交校验示例；本项目需要“首次提交后持续校验”，因此采用 `revalidateLogic` + `onDynamic` 是在该最小示例之上的正确扩展，而不是必须改回 `onSubmit`。

项目当前 shadcn 配置由 `pnpm dlx shadcn@latest info --json` 确认：Vite、Tailwind v4、Radix、`new-york`、Lucide，别名 `@/components/ui`。

shadcn 的推荐组合是：

- 表单布局使用 `FieldGroup` + `Field`，间距使用 `gap-*`，不要用 `space-y-*`。
- 错误状态：`data-invalid` 放在 `Field`，`aria-invalid` 放在实际控件（Input、SelectTrigger、Checkbox、RadioGroup 等）。
- 错误内容使用 `FieldError`；相关 checkbox/radio/switch 使用 `FieldSet` + `FieldLegend` 分组。

项目多数业务字段已经正确设置 `data-invalid`、`aria-invalid`，并使用 `FieldError`；布局层仍有若干 `space-y-*` 需要后续按页面迁移到 `FieldGroup`。

## 当前代码检查结果

### 已符合

- 以下使用 `useForm` 的业务表单均已发现 `revalidateLogic()` 与 `validators.onDynamic`：认证、任务、用户、权限、设置、组件 demo、survey workspace。
- 错误展示普遍采用：

  ```ts
  field.state.meta.errors.length > 0 &&
    (field.state.meta.isTouched || form.state.submissionAttempts > 0)
  ```

  这保证首次提交后未触碰字段也能显示错误，并且错误实际清除后才消失。
- shadcn `Field`/`FieldError` 与控件 `aria-invalid` 的组合已覆盖大部分可见业务字段。
- survey workspace 的图片可访问性检查使用 `onDynamicAsync` + debounce，符合动态异步验证模型。

### 需要改进

- `src/features/**` 中仍有多处表单根节点或布局节点使用 `space-y-4`、`space-y-6`、`space-y-8`；应按 shadcn 规则改为 `FieldGroup` 和 `gap-*`。
- `rg` 检查显示没有业务表单统一订阅 `form.state.canSubmit`/`form.state.isSubmitting`。部分页面使用自定义 `isPending`/`isLoading`，部分页面完全没有提交中状态。
- `user-auth-form.tsx`、`sign-up-form.tsx` 等将实际异步工作放进 `startTransition` 回调，但 TanStack 的 `onSubmit` 回调本身立即结束。应让 `onSubmit` 返回并等待请求，或用 API mutation 的 promise：

  ```tsx
  onSubmit: async ({ value }) => {
    await auth.login(value)
  }
  ```

- 对话框关闭/重置表单是产品行为，不应在通用表单规则中自动处理；重置会清除提交计数和错误状态，需确认关闭后再次打开是否符合预期。

## 建议的项目级标准模板

```tsx
const form = useForm({
  defaultValues,
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: {
    onDynamic: formSchema,
    // 真实后端校验时：onSubmitAsync 返回 form/fields 错误
  },
  onSubmit: async ({ value }) => {
    await save(value)
  },
})
```

```tsx
<form
  onSubmit={(event) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }}
>
  <FieldGroup>
    {/* 每个字段：Field + FieldLabel + 控件 aria-invalid + FieldError */}
  </FieldGroup>
  <form.Subscribe
    selector={(state) => ({
      canSubmit: state.canSubmit,
      isSubmitting: state.isSubmitting,
    })}
  >
    {({ canSubmit, isSubmitting }) => (
      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
        提交
      </Button>
    )}
  </form.Subscribe>
</form>
```

## 审计判定

验证时机重构本身：**通过**。  
TanStack Form 与 shadcn Field 的整体选型：**推荐，方向正确**。  
提交生命周期、按钮状态、布局语义和服务端错误映射：**部分符合，建议作为下一轮统一改造项**。
