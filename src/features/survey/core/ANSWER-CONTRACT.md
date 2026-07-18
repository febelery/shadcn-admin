# Answer Contract

Answer payloads store stable identities. Labels and titles are presentation data and must never be persisted as answer keys or values.

| Question family                | Canonical answer value               |
| ------------------------------ | ------------------------------------ |
| Single choice / dropdown       | `option.id`                          |
| Multiple choice                | `option.id[]`                        |
| Ranking                        | ordered `option.id[]`                |
| Cascader                       | ordered node `id[]` path             |
| Matrix single                  | `Record<row.id, column.id>`          |
| Matrix multiple                | `Record<row.id, column.id[]>`        |
| Likert                         | `Record<statement.id, number>`       |
| Text / email / phone / URL     | `string`                             |
| Number / rating / slider / NPS | `number`                             |
| Date                           | ISO date `YYYY-MM-DD`                |
| Date range                     | `{ start: ISO date, end: ISO date }` |

Record and analysis adapters resolve IDs against the current question definition when rendering labels. Renaming an option, row, column or statement changes presentation only; rules, filters and historical aggregation continue to use the same identity.

`validateQuestionAnswer(question, answer, { visible })` is the executable contract. Hidden questions do not participate in validation. Visible optional questions may omit an answer; visible required questions must provide one. A datetime needs a separate instant and timezone contract, so the current date questions only accept calendar dates.
