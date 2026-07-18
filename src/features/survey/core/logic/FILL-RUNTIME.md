# 填写端运行时契约（Fill Runtime）

Admin 设计器校验规则结构与语义；**规则求值、显隐、跳题导航**由独立填写端（consumer app）实现。本文档为填写端与 Admin 之间的行为契约。

## 数据模型

- 规则数组：`document.rules: Rule[]`
- 单条规则：结构化 `condition` + `action`
- 动作类型（MVP）：`show` | `hide` | `jump_to_question` | `end`

## 求值顺序

1. 仅处理 `enabled === true` 的规则
2. 按 `priority` **升序**；同优先级按 `id` 字典序稳定排序
3. 对每条规则：若 `evaluate(condition)` 为真，则执行 `action`
4. `end` 动作命中后**立即终止**问卷，不再评估后续规则

## 显隐默认策略

对每道题目 `q`：

1. **无**任何 `show` 规则以 `q` 为 `target` → 初始 **可见**
2. **存在** `show` 规则以 `q` 为 `target` → 初始 **隐藏**；任一匹配且启用的 `show` 规则条件为真 → **可见**
3. 任一匹配且启用的 `hide` 规则条件为真 → **隐藏**（覆盖 show）
4. 显隐仅影响 UI 与必填校验范围；不改变 document 中题目顺序

## 跳题导航

1. `jump_to_question`：当前题提交/下一题时，若存在匹配规则，导航至 `target` 题目（必须在条件题之后）
2. `end`：进入结束页，提交当前已填答案
3. 跳题**不自动 hide** 被跳过的题目；导航引擎应计算「下一道**可见**题」
4. 默认顺序：按 `elements[]` 顺序（与 `flattenQuestions` 一致），跳过不可见题

### 下一题算法（伪代码）

```
function getNextQuestion(currentId, answers, document):
  rules = sorted enabled rules by priority
  for rule in rules:
    if evaluate(rule.condition, answers) and rule.action is jump/end from current:
      return apply jump/end action

  candidates = questions after currentId in flatten order
  for question in candidates:
    if isVisible(question, answers, document):
      return question.id
  return null // survey complete
```

## 必填校验

- 静态 `required: true` 的题目，仅在**可见**时校验
- 被 `hide` 隐藏的题目不校验（即使 `required: true`）

## 答案引用

- 条件题引用：`condition.questionId`
- 单选/下拉：`condition.value` 必须是稳定 option `id`
- 多选：数组，使用 `contains` 运算符
- 空值：`empty` / `not_empty`

## 与 Admin 静态分析对齐

填写端应假设已通过 Admin `analyseSurvey` 的 error 级检查：

- 条件题、运算符与 option 引用存在且匹配
- 条件题在目标题之前（显隐/跳题）
- 跳转目标题目存在
  warn 级（显隐冲突、相同条件的导航冲突）不阻断发布，填写端可按契约保守处理。

## 版本

- Schema `schemaVersion: 2` 支持 `jump_to_question`
- 当前 Schema 是单页元素序列；需要多页能力时应先增加完整页面创作模型，再扩展跨页跳转。
