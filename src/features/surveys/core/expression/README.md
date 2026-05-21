# Rule Expression DSL

Admin 当前只支持单条件表达式，作为可视化规则编辑器和流程图的共同契约。

References: `{q.<id>}`.

Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `not contains`, `empty`, `notEmpty`.

Unsupported for now: `{var.*}`, `{section.*}`, `and`, `or`, `not`, functions, nested expressions. Admin publishes these as blocking errors instead of guessing a source question.
