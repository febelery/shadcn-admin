# Answer Contract

Answer payloads store stable identities. Labels and titles are presentation data and must never be persisted as answer keys or values.

| Question family          | Canonical answer value         |
| ------------------------ | ------------------------------ |
| Single choice / dropdown | `option.id`                    |
| Multiple choice          | `option.id[]`                  |
| Ranking                  | ordered `option.id[]`          |
| Cascader                 | ordered node `id[]` path       |
| Matrix single            | `Record<row.id, column.id>`    |
| Matrix multiple          | `Record<row.id, column.id[]>`  |
| Likert                   | `Record<statement.id, number>` |

Record and analysis adapters resolve IDs against the current question definition when rendering labels. Renaming an option, row, column or statement changes presentation only; rules, filters and historical aggregation continue to use the same identity.
