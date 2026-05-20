# Survey module (Admin)

Design surveys, publish schemas, view analytics, export Excel.

- `queries/` — React Query hooks 与 key 工厂（HTTP 客户端见 `src/api/surveys.ts`）
- `core/` — Schema types、`migrateSurveySchema`、`validators`
- `builder/` — Visual editor
  - `workspace/` — 三栏布局（`shell`）、中间编辑区、拖放与元素卡片
  - `question-surface/` — 单题 WYSIWYG 作答区
  - `question-surface-registry.tsx` — 题型 → 作答区唯一注册点
  - `question-type-inspector.tsx` — 检查器题型唯一注册点
- `list/` / `analytics/` — 列表与统计

**命名**：工作区 `workspace/*`（`Workspace*`）· 作答区 `question-surface/*`（`Surface*`）

**Schema 边界**：`rules` / `variables` / `validators` / `panel` 暂无可视化编辑；`dynamic_panel.templateElements` 仅数据层支持。历史字段（含已废弃 `media_choice`）仅在 `migrate.ts` 的 `Legacy*` 类型中处理。

**保存/发布**：`getSchemaForSave()` → `validateSurveySchema` + 发布前 `analyseSurvey`。

Fill runtime lives in a separate consumer app. MSW: `src/mocks/handlers/surveys.ts`.
