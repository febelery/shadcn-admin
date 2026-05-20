# Expression DSL (design-time)

References: `{q.<id>}`, `{var.<name>}`, `{section.<id>}`.

Operators: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `empty`, `notEmpty`, `and`, `or`, `not`.

Functions: `today()`, `length()`, `iif(cond, a, b)`.

Admin only validates syntax and referenced IDs; evaluation runs in the fill app.
