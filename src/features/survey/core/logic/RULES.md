# Rule Contract

The survey document's `rules` array is the canonical rule source and its array position is the execution order. A rule contains one structured `condition` and one `action`; no duplicate priority field or string expression is persisted or parsed.

```ts
type RuleCondition =
  | { questionId: string; operator: 'empty' | 'not_empty' }
  | {
      questionId: string
      operator:
        'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains'
      value: string | number
    }
```

Choice values are stable option IDs. Number and date comparisons are normalized by the runtime evaluator. `between`, compound groups, variables and functions are not rule capabilities.

Adding a capability requires changing the document schema, authoring UI, analyzer and fill runtime together. Do not add a parser or a second persisted representation.
