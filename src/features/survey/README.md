# Survey module (Admin)

问卷设计、规则创作、发布、记录与分析。

- `core/`：`SurveyDocument`、合法题目工厂、规则语义、静态分析与 Zod 解码
- `builder/builder-session.tsx`：Builder 会话的 React interface，仅暴露 Provider 与 selector hooks
- `builder/session/`：单个 Builder 会话的文档、编辑焦点、规则草稿与 dirty 状态实现
- `builder/edit/`：题目画布、题型 Surface、Inspector 与问卷设置
- `builder/flow/`：从文档派生的流程投影、规则列表与规则编辑入口
- `builder/rules/`：编辑画布与流程模式共享的规则创作 UI
- `builder/shared/`：编辑和流程模式共同使用的 DnD 与面板组件
- `shared/question-type-labels.ts`：无图标依赖的题型展示名称，供分析和 Builder 复用
- `shared/question-ui-registry.ts`：Palette 分类与图标，不参与文档 mutation 或规则能力判定
- `query/`：React Query hooks 与缓存 key；HTTP adapter 位于 `src/api/survey.ts`
- `list/`、`record/`、`analysis/`：管理端查询视图

持久化边界：HTTP 返回值必须经 `parseSurveyDocument()` 解码。create、update、publish 均返回完整规范文档，Builder 通过 `adoptDocument()` 接管服务端事实；不能仅切换 dirty 或局部回填发布字段。

`document-factory.ts` 只负责默认文档；`document-elements.ts` 负责从单页 `elements[]` 派生题目序列。文档实体 ID 直接使用浏览器原生 `crypto.randomUUID()`，不增加透传包装。

`core/question-numbering.ts` 只包含文档序号计算与缓存；`shared/numbering-options.ts` 只包含 UI 下拉文案和 CSS class，core 不反向依赖 shared。

当前文档契约是单页 `elements[]`，不保存没有创作界面的 page/section 占位结构。需要多页时，必须先建立完整的页面创作与跨页导航模型。`schemaVersion` 表示文档格式，`revision` 表示发布修订，两者不可复用。

`document-schema.ts` 严格拒绝未知持久化字段；`document-identities.ts` 保证 element、rule 与 action 在各自命名空间内唯一。重复身份不能进入 Builder。没有稳定答案身份或完整运行时契约的 fill-in、signature、file upload、dynamic panel、variable、字符串 validator、presentation 与 extensions 不属于当前文档。

题型与 config 通过 `QuestionConfigByType` 判别联合建模。`question-config.ts` 统一负责持久化解析、字段所有权和依赖数值的原子归一化；Store 不直接合并任意 config。

`core/question-factory.ts` 只创建具有合法默认配置的题目；规则条件能力由 `core/logic/rule-capabilities.ts` 拥有；Palette 和 Inspector 元数据分别留在其 UI 模块。三者不能重新合并为通用题型注册表。

选项答案只保存稳定 `option.id`。在建立“选项身份 + 自填文本”的结构化答案契约前，不提供伪装成普通选项的「其他自填」。

`submissionPolicy` 使用一套扁平配额语言：`totalLimit`、`dailyLimit`、`perUserLimit`、`dailyPerUserLimit` 与 `perDeviceLimit`。字段存在即生效，字段缺失即不限制；不保存 `enabled`、`oncePerUser` 或 `0 表示无限` 等重复状态。`opensAt` 与 `closesAt` 持久化为 UTC instant，不能保存依赖浏览器时区解释的本地时间。

规则与问卷结构是事实来源，`rules[]` 的数组位置是唯一执行顺序，不保存第二套 priority。流程图是派生视图：`core/logic/flow-graph.ts` 只构建领域节点和规则边，`builder/flow/layout.ts` 才负责 Dagre 坐标；规则编辑使用显式草稿事务，未来 XYFlow 连线只创建规则草稿意图。

规则条件持久化为 `condition.questionId/operator/value`，不保存或解析字符串 DSL。规则能力必须同时覆盖文档 schema、创作 UI、静态分析和填写端求值。

选择、排序、级联、矩阵与 Likert 答案使用稳定 ID，label 仅用于展示。完整约定见 `core/ANSWER-CONTRACT.md`。

填写运行时位于独立 consumer app。开发期 HTTP 实现在 `src/mocks/handlers/survey.ts`。
