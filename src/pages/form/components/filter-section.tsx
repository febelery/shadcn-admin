import { useState, useMemo, useEffect, useCallback } from "react";
import { format, addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { X, Filter, Plus, CalendarIcon } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/magicui/border-beam";

import {
  type FormField,
  type FilterCondition,
  type FilterGroup,
} from "@/pages/form/form.d";

// 重命名为更具描述性的名称
const FILTER_FIELD_TYPES = ["radio", "checkbox", "select"];

// 简化日期预设的实现
const DATE_PRESETS = [
  {
    label: "本周",
    getValue: () => {
      const now = new Date();
      const weekStart = addDays(now, -(now.getDay() || 7) + 1);
      return { from: weekStart, to: addDays(weekStart, 6) };
    },
  },
  {
    label: "上周",
    getValue: () => {
      const now = new Date();
      const currentDay = now.getDay() || 7;
      const startDate = addDays(now, -currentDay - 6);
      const endDate = addDays(startDate, 6);
      return { from: startDate, to: endDate };
    },
  },
  {
    label: "本月",
    getValue: () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: startDate, to: endDate };
    },
  },
  {
    label: "上月",
    getValue: () => {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startDate, to: endDate };
    },
  },
];

interface FilterPopoverProps {
  fields: FormField[][];
  groups: FilterGroup[];
  onChange: (groups: FilterGroup[]) => void;
  onConfirm: () => void;
  onReset: () => void;
}

function FilterPopover({
  fields,
  groups,
  onChange,
  onConfirm,
  onReset,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  // 优化字段分类逻辑
  const filterableFields = useMemo(() => {
    const formFields = fields[0] || [];
    const filterable = formFields.filter((f) =>
      FILTER_FIELD_TYPES.includes(f.type)
    );
    return {
      fields: filterable,
      navFields: filterable,
    };
  }, [fields]);

  // 简化字段获取逻辑
  const getFieldByKey = useCallback(
    (fieldKey: string) =>
      filterableFields.fields.find((field) => field.key === fieldKey),
    [filterableFields]
  );

  // 优化操作符获取逻辑
  const getOperators = useCallback((fieldType: string) => {
    const operatorMap = {
      radio: [
        { value: "equals", label: "等于" },
        { value: "notEquals", label: "不等于" },
      ],
      select: [
        { value: "equals", label: "等于" },
        { value: "notEquals", label: "不等于" },
      ],
      checkbox: [
        { value: "contains", label: "包含" },
        { value: "notContains", label: "不包含" },
      ],
    };
    return operatorMap[fieldType as keyof typeof operatorMap] || [];
  }, []);

  // 优化条件完整性检查
  const isConditionComplete = useCallback(
    (condition: FilterCondition) => {
      if (!condition.fieldKey || !condition.operator) return false;

      const field = getFieldByKey(condition.fieldKey);
      if (!field) return false;

      return field.type === "checkbox"
        ? Array.isArray(condition.value) && condition.value.length > 0
        : Boolean(condition.value);
    },
    [getFieldByKey]
  );

  // 简化条件添加逻辑
  const createNewCondition = (): FilterCondition => ({
    fieldKey: "",
    operator: "",
    value: [],
    id: String(Date.now()),
  });

  // 优化组添加逻辑
  const addGroup = useCallback(() => {
    onChange([
      ...groups,
      {
        conditions: [createNewCondition()],
        id: `group-${Date.now()}`,
        logic: "AND",
      },
    ]);
  }, [groups, onChange]);

  // 获取指定组内已使用的字段
  const getUsedFieldsInGroup = (groupIndex: number) => {
    const fields = new Set<string>();
    groups[groupIndex].conditions.forEach((condition: FilterCondition) => {
      if (condition.fieldKey) {
        fields.add(condition.fieldKey);
      }
    });
    return fields;
  };

  // 获取当前组内可选字段（排除当前组内已选的）
  const getAvailableFields = (
    groupIndex: number,
    currentFieldKey: string = ""
  ) => {
    const usedFields = getUsedFieldsInGroup(groupIndex);
    return filterableFields.fields.filter(
      (field) =>
        !usedFields.has(field.key ?? "") ||
        (field.key ?? "") === currentFieldKey
    );
  };

  // 修改操作符选择的处理
  const handleOperatorChange = (
    value: string,
    groupIndex: number,
    conditionIndex: number
  ) => {
    const newGroups = [...groups];
    const newConditions = [...newGroups[groupIndex].conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      operator: value,
      value:
        newConditions[conditionIndex].fieldKey &&
        getFieldByKey(newConditions[conditionIndex].fieldKey)?.type ===
          "checkbox"
          ? []
          : "",
    };
    newGroups[groupIndex].conditions = newConditions;
    onChange(newGroups);
  };

  // 修改值选择器的渲染
  const renderValueSelector = (
    field: FormField,
    condition: FilterCondition,
    groupIndex: number,
    conditionIndex: number
  ) => {
    switch (field.type) {
      case "checkbox":
        return (
          <MultiSelect
            value={Array.isArray(condition.value) ? condition.value : []}
            onValueChange={(values) =>
              handleMultiSelectChange(values, groupIndex, conditionIndex)
            }
            options={
              field.content?.options?.map((option) => ({
                label: option,
                value: option,
              })) || []
            }
            className="w-[200px]"
            placeholder="选择值"
          />
        );
      case "radio":
      case "select":
        return (
          <Select
            value={
              Array.isArray(condition.value)
                ? condition.value[0]
                : condition.value
            }
            onValueChange={(value) => {
              const newGroups = [...groups];
              const newConditions = [...newGroups[groupIndex].conditions];
              newConditions[conditionIndex] = {
                ...newConditions[conditionIndex],
                value: value,
              };
              newGroups[groupIndex].conditions = newConditions;
              onChange(newGroups);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择值" />
            </SelectTrigger>
            <SelectContent>
              {field.content?.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  // 检查是否可以在当前组添加新条件
  const canAddCondition = (groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group || !group.conditions.length) return false;

    // 检查最后一个条件是否完整
    const lastCondition = group.conditions[group.conditions.length - 1];
    const isComplete = isConditionComplete(lastCondition);

    // 检查是否还有可选字段
    const hasAvailableFields = getAvailableFields(groupIndex).length > 0;

    return isComplete && hasAvailableFields;
  };

  // 渲染值选择器时的处理
  const handleMultiSelectChange = (
    values: string[],
    groupIndex: number,
    conditionIndex: number
  ) => {
    const newGroups = [...groups];
    const newConditions = [...newGroups[groupIndex].conditions];
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      value: values,
    };
    newGroups[groupIndex].conditions = newConditions;
    onChange(newGroups);
  };

  // 修改字段选择器的渲染
  const renderFieldSelector = (
    condition: FilterCondition,
    groupIndex: number,
    conditionIndex: number
  ) => {
    const availableFields = getAvailableFields(groupIndex, condition.fieldKey);

    return (
      <Select
        value={condition.fieldKey}
        onValueChange={(value) =>
          handleFieldChange(value, groupIndex, conditionIndex)
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="题目" />
        </SelectTrigger>
        <SelectContent>
          {availableFields.map((field) => (
            <SelectItem key={field.key ?? ""} value={field.key ?? ""}>
              {field.index}. {field.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // 添加新条件时确保正确初始化值
  const addCondition = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].conditions.push({
      fieldKey: "",
      operator: "",
      value: [],
      id: String(Date.now()),
    });
    onChange(newGroups);
  };

  // 当字段类型改变时重置值
  const handleFieldChange = (
    value: string,
    groupIndex: number,
    conditionIndex: number
  ) => {
    const newGroups = [...groups];
    const field = getFieldByKey(value);
    const newValue = field?.type === "checkbox" ? [] : "";

    newGroups[groupIndex].conditions[conditionIndex] = {
      ...newGroups[groupIndex].conditions[conditionIndex],
      fieldKey: value,
      operator: "",
      value: newValue,
    };
    onChange(newGroups);
  };

  // 删除条件
  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...groups];
    newGroups[groupIndex].conditions = newGroups[groupIndex].conditions.filter(
      (_: any, index: number) => index !== conditionIndex
    );
    onChange(newGroups);
  };

  // 计算有效的筛选条件数量
  const validConditionsCount = groups.reduce(
    (total: number, group: FilterGroup) => {
      return (
        total +
        group.conditions.filter((condition: FilterCondition) =>
          isConditionComplete(condition)
        ).length
      );
    },
    0
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          筛选
          {validConditionsCount > 0 && (
            <div className="ml-1 h-5 min-w-[20px] rounded-full bg-primary/10 px-2 text-xs font-medium leading-5 text-primary flex items-center justify-center">
              {validConditionsCount}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[680px] p-6 relative" align="start">
        <BorderBeam duration={8} size={100} />

        {/* 标题区域 */}
        <div className="mb-6">
          <h4 className="font-semibold text-lg mb-2">高级筛选</h4>
          <p className="text-sm text-muted-foreground">
            通过添加条件组合筛选数据，组内条件使用"且"连接，组间条件可选择"且/或"连接
          </p>
        </div>

        {/* 条件组区域 */}
        <div className="space-y-4">
          {groups.map((group: FilterGroup, groupIndex: number) => (
            <div
              key={group.id}
              className="relative rounded-lg border bg-card transition-all hover:shadow-md"
            >
              {/* 条件组标题栏 */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-t-lg border-b">
                <div className="flex items-center gap-3">
                  <div className=" rounded-full bg-primary/10 px-2 text-sm font-medium leading-5 text-primary flex items-center justify-center">
                    条件组 {groupIndex + 1}
                  </div>
                  {groups.length > 1 && (
                    <Select
                      value={group.logic || "AND"}
                      onValueChange={(value) => {
                        const newGroups = [...groups];
                        newGroups[groupIndex] = {
                          ...group,
                          logic: value as "AND" | "OR",
                        };
                        onChange(newGroups);
                      }}
                    >
                      <SelectTrigger className="h-7 w-24 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">且</SelectItem>
                        <SelectItem value="OR">或</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {groups.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      onChange(
                        groups.filter((g: FilterGroup) => g.id !== group.id)
                      );
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* 条件组内容 */}
              <div className="p-4 space-y-3">
                {group.conditions.map(
                  (condition: FilterCondition, conditionIndex: number) => (
                    <div
                      key={condition.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-background/40 hover:bg-background transition-colors"
                    >
                      {/* 字段选择器 */}
                      {renderFieldSelector(
                        condition,
                        groupIndex,
                        conditionIndex
                      )}

                      {/* 操作符选择器 */}
                      <Select
                        value={condition.operator}
                        disabled={!condition.fieldKey}
                        onValueChange={(value) =>
                          handleOperatorChange(
                            value,
                            groupIndex,
                            conditionIndex
                          )
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="操作符" />
                        </SelectTrigger>
                        <SelectContent>
                          {condition.fieldKey &&
                            getOperators(
                              getFieldByKey(condition.fieldKey)?.type || ""
                            ).map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* 值选择器 */}
                      {condition.fieldKey &&
                        condition.operator &&
                        renderValueSelector(
                          getFieldByKey(condition.fieldKey) as FormField,
                          condition,
                          groupIndex,
                          conditionIndex
                        )}

                      {/* 删除按钮 */}
                      {group.conditions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive ml-auto"
                          onClick={() =>
                            removeCondition(groupIndex, conditionIndex)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                )}

                {/* 添加条件按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={!canAddCondition(groupIndex)}
                  onClick={() => addCondition(groupIndex)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加条件
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="rounded-full w-full"
            disabled={!canAddCondition(groups.length - 1)}
            onClick={addGroup}
          >
            <Plus className="mr-2 h-4 w-4" />
            添加条件组
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p>• 每个条件组内不能使用重复的题目</p>
              <p>• 不同条件组之间可以使用相同的题目</p>
              <p>• 示例：(部门=A 且 性别=男) 或 (部门=B 且 性别=女)</p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
          >
            重置
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DateRangeWithPresetsProps {
  onDateChange: (range: DateRange) => void;
}

function DateRangeWithPresets({ onDateChange }: DateRangeWithPresetsProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = useCallback((range: DateRange | undefined) => {
    if (range) setDateRange(range);
  }, []);

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const emptyRange = { from: undefined, to: undefined };
      setDateRange(emptyRange);
      onDateChange(emptyRange);
    },
    [onDateChange]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 relative pr-8"
        >
          <CalendarIcon className="h-4 w-4" />
          {dateRange.from && dateRange.to ? (
            <span>
              {format(dateRange.from, "yyyy-MM-dd")}~{" "}
              {format(dateRange.to, "yyyy-MM-dd")}
            </span>
          ) : (
            <span className="text-muted-foreground">选择日期范围</span>
          )}
          {dateRange.from && dateRange.to && (
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer hover:text-destructive transition-colors"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  const range = preset.getValue();
                  setDateRange(range);
                }}
                className="h-7"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!dateRange.from || !dateRange.to}
              onClick={() => {
                onDateChange(dateRange);
                setIsOpen(false);
              }}
              className="h-7"
            >
              确定
            </Button>
          </div>
        </div>
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.from || new Date()}
          selected={dateRange}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  );
}

interface FilterParams {
  filter?: {
    mode: string;
    conds: Array<{
      ref: { type: string; field: string };
      comp: string;
      val: string | string[];
    }>;
  }[];
}

interface FilterSectionProps {
  fields: FormField[][];
  onFilterParamsChange: (params: FilterParams) => void;
}

export function FilterSection({
  fields,
  onFilterParamsChange,
}: FilterSectionProps) {
  // 状态定义
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      conditions: [
        {
          fieldKey: "createdAt",
          operator: "between",
          value: [],
          id: "date-range",
        },
      ],
      id: "group-1",
      logic: "AND",
    },
    {
      conditions: [
        {
          fieldKey: "",
          operator: "",
          value: [],
          id: String(Date.now()),
        },
      ],
      id: `group-${Date.now()}`,
      logic: "AND",
    },
  ]);

  // 新增一个状态来追踪实际应用的筛选条件
  const [appliedFilters, setAppliedFilters] =
    useState<FilterGroup[]>(filterGroups);

  // 处理函数
  const handleFilterChange = (groups: FilterGroup[]) => {
    setFilterGroups((prev) => {
      // 保持日期筛选组（第一组）不变，更新其他组
      return [prev[0], ...groups];
    });
  };

  const handleDateRangeChange = (range: DateRange) => {
    const { from, to } = range;
    const newGroups = [...filterGroups];
    newGroups[0].conditions[0] = {
      ...newGroups[0].conditions[0],
      value:
        from && to
          ? [format(from, "yyyy-MM-dd"), format(to, "yyyy-MM-dd")]
          : [],
    };
    setFilterGroups(newGroups);
    // 日期筛选立即生效
    setAppliedFilters(newGroups);
  };

  // 获取筛选参数
  const getFilterParams = useCallback(() => {
    const validGroups = appliedFilters.filter((group) =>
      group.conditions.some((condition) => {
        if (condition.fieldKey === "createdAt") {
          return Array.isArray(condition.value) && condition.value.length === 2;
        }
        return (
          condition.value &&
          (Array.isArray(condition.value) ? condition.value.length > 0 : true)
        );
      })
    );

    if (!validGroups.length) return {};

    const filter = validGroups.map((group) => {
      const validConditions = group.conditions.filter((condition) => {
        if (condition.fieldKey === "createdAt") {
          return Array.isArray(condition.value) && condition.value.length === 2;
        }
        return (
          condition.value &&
          (Array.isArray(condition.value) ? condition.value.length > 0 : true)
        );
      });

      return {
        mode: group.logic?.toLowerCase() || "and",
        conds: validConditions
          .map((condition) => {
            if (
              condition.fieldKey === "createdAt" &&
              condition.value.length === 2
            ) {
              const [start, end] = condition.value as string[];
              return [
                {
                  ref: { type: "date-time", field: "createdAt" },
                  comp: "gte",
                  val: start,
                },
                {
                  ref: { type: "date-time", field: "createdAt" },
                  comp: "lte",
                  val: end,
                },
              ];
            }

            const operatorMap: Record<string, string> = {
              equals: "eq",
              notEquals: "neq",
              contains: "contains",
              notContains: "not_contains",
            };

            return {
              ref: { type: "field", field: condition.fieldKey },
              comp: operatorMap[condition.operator] || condition.operator,
              val: condition.value,
            };
          })
          .flat(),
      };
    });

    return { filter };
  }, [appliedFilters]);

  // 监听筛选条件变化
  useEffect(() => {
    const params = getFilterParams();
    onFilterParamsChange(params);
  }, [appliedFilters, getFilterParams, onFilterParamsChange]);

  return (
    <div className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center gap-4 px-4">
        <DateRangeWithPresets onDateChange={handleDateRangeChange} />
        <FilterPopover
          fields={fields}
          groups={filterGroups.slice(1)}
          onChange={handleFilterChange}
          onConfirm={() => setAppliedFilters(filterGroups)}
          onReset={() => {
            const resetGroups: FilterGroup[] = [
              filterGroups[0], // 保留日期筛选
              {
                conditions: [
                  {
                    fieldKey: "",
                    operator: "",
                    value: [],
                    id: String(Date.now()),
                  },
                ],
                id: `group-${Date.now()}`,
                logic: "AND",
              },
            ];
            setFilterGroups(resetGroups);
            setAppliedFilters(resetGroups);
          }}
        />
      </div>
    </div>
  );
}
