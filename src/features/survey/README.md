# Survey module (Admin)

问卷设计、规则创作、发布、记录与分析。

- `core/`：持久化文档、题型定义、规则语义、静态分析与 `document-schema.ts` Zod 解码
- `builder/store/`：单个 Builder 会话的文档、编辑焦点、规则草稿与 dirty 状态
- `builder/edit/`：题目画布、题型 Surface、Inspector 与问卷设置
- `builder/flow/`：从文档派生的流程投影、规则列表与规则编辑入口
- `builder/shared/`：编辑和流程模式共同使用的 DnD 与面板组件
- `query/`：React Query hooks 与缓存 key；HTTP adapter 位于 `src/api/survey.ts`
- `list/`、`record/`、`analysis/`：管理端查询视图

持久化边界：HTTP 返回值必须经 `parseSurveyDocument()` 解码。create、update、publish 均返回完整规范文档，Builder 通过 `adoptDocument()` 接管服务端事实；不能仅切换 dirty 或局部回填发布字段。

当前文档契约明确只支持一个 `section`，不接受静默合并。`schemaVersion` 表示文档格式，`revision` 表示发布修订，两者不可复用。

规则与问卷结构是事实来源，流程图是派生视图。规则编辑使用显式草稿事务；未来 XYFlow 连线只创建规则草稿意图。

填写运行时位于独立 consumer app。开发期 HTTP 实现在 `src/mocks/handlers/survey.ts`。
