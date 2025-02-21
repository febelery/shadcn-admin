export type DataTableConfig = typeof dataTableConfig;

export const dataTableConfig = {
  textOperators: [
    { label: "包含", value: "iLike" as const },
    { label: "不包含", value: "notILike" as const },
    { label: "等于", value: "eq" as const },
    { label: "不等于", value: "ne" as const },
    { label: "为空", value: "isEmpty" as const },
    { label: "不为空", value: "isNotEmpty" as const },
  ],
  numericOperators: [
    { label: "等于", value: "eq" as const },
    { label: "不等于", value: "ne" as const },
    { label: "小于", value: "lt" as const },
    { label: "小于或等于", value: "lte" as const },
    { label: "大于", value: "gt" as const },
    { label: "大于或等于", value: "gte" as const },
    { label: "为空", value: "isEmpty" as const },
    { label: "不为空", value: "isNotEmpty" as const },
  ],
  dateOperators: [
    { label: "等于", value: "eq" as const },
    { label: "不等于", value: "ne" as const },
    { label: "早于", value: "lt" as const },
    { label: "晚于", value: "gt" as const },
    { label: "早于或等于", value: "lte" as const },
    { label: "晚于或等于", value: "gte" as const },
    { label: "介于", value: "isBetween" as const },
    { label: "相对于今天", value: "isRelativeToToday" as const },
    { label: "为空", value: "isEmpty" as const },
    { label: "不为空", value: "isNotEmpty" as const },
  ],
  selectOperators: [
    { label: "等于", value: "eq" as const },
    { label: "不等于", value: "ne" as const },
    { label: "为空", value: "isEmpty" as const },
    { label: "不为空", value: "isNotEmpty" as const },
  ],
  booleanOperators: [
    { label: "是", value: "eq" as const },
    { label: "否", value: "ne" as const },
  ],
  joinOperators: [
    { label: "且", value: "and" as const },
    { label: "或", value: "or" as const },
  ],
  sortOrders: [
    { label: "升序", value: "asc" as const },
    { label: "降序", value: "desc" as const },
  ],
  columnTypes: [
    "text",
    "number",
    "date",
    "boolean",
    "select",
    "multi-select",
  ] as const,
  globalOperators: [
    "iLike",
    "notILike",
    "eq",
    "ne",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
    "isBetween",
    "isRelativeToToday",
    "and",
    "or",
  ] as const,

  // 添加操作符冲突规则配置
  operatorConflicts: {
    // 互斥的操作符对
    mutuallyExclusive: [
      ["isEmpty", "isNotEmpty"],
      ["iLike", "notILike"],
      ["eq", "ne"],
      ["lt", "gte"],
      ["lte", "gt"],
    ] as const,

    // 范围操作符
    rangeOperators: ["lt", "lte", "gt", "gte", "isBetween"] as const,

    // 日期特殊操作符
    dateSpecialOperators: ["isBetween", "isRelativeToToday"] as const,

    // 最大范围条件数量
    maxRangeConditions: 2,

    // 相似条件组（具有相同效果的操作符组）
    similarOperators: [
      // 肯定条件组
      ["eq", "iLike", "contains"] as const,
      // 否定条件组
      ["ne", "notILike", "notContains"] as const,
    ] as const,

    // 互补条件组（一个成立另一个必然不成立的操作符组）
    complementaryOperators: [
      ["eq", "ne"],
      ["iLike", "notILike"],
      ["contains", "notContains"],
      ["isEmpty", "isNotEmpty"],
    ] as const,
  },

  // 操作符分组配置
  operatorGroups: {
    // 空值操作符
    empty: ["isEmpty", "isNotEmpty"] as const,
    // 文本操作符
    text: ["iLike", "notILike"] as const,
    // 相等性操作符
    equality: ["eq", "ne"] as const,
    // 范围操作符
    range: ["lt", "lte", "gt", "gte", "isBetween"] as const,
    // 日期特殊操作符
    dateSpecial: ["isBetween", "isRelativeToToday"] as const,
  },

  // 操作符验证规则
  operatorValidation: {
    // 不需要值的操作符
    noValueRequired: ["isEmpty", "isNotEmpty"] as const,

    // 需要数组值的操作符
    arrayValueRequired: ["isBetween"] as const,
  },
} as const;

// 添加类型导出
export type OperatorConflicts = typeof dataTableConfig.operatorConflicts;
export type OperatorGroups = typeof dataTableConfig.operatorGroups;
export type OperatorValidation = typeof dataTableConfig.operatorValidation;
