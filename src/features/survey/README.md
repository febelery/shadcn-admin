# Survey module (Admin)

Design survey, publish schemas, view analytics, export Excel.

- `query/` — React Query hooks 与 key 工厂（HTTP 客户端见 `src/api/survey.ts`）
- `core/` — Schema types、`migrateSurveySchema`、`validators`
- `builder/` — Visual editor
  - `workspace/` — 三栏布局（`shell`）、中间编辑区、拖放与元素卡片
  - `question-surface/` — 单题 WYSIWYG 作答区
  - `question-surface-registry.tsx` — 题型 → 作答区唯一注册点
  - `question-type-inspector.tsx` — 检查器题型唯一注册点
- `list/` / `record/` / `analytics/` — 列表、填写记录与统计

**命名**：工作区 `workspace/*`（`Workspace*`）· 作答区 `question-surface/*`（`Surface*`）

**Schema 边界**：`variables` / `validators` / `panel` 暂无可视化编辑；`rules` 与 `jump_to_question` 已在设计器「逻辑」Tab 与「流程」模式中编辑。`dynamic_panel.templateElements` 仅数据层支持。

**保存/发布**：`getSchemaForSave()` → `validateSurveySchema` + 发布前 `analyseSurvey`。

Fill runtime lives in a separate consumer app. MSW: `src/mocks/handlers/survey.ts`.
