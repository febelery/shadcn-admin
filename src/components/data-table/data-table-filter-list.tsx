"use client";

import type {
  DataTableFilterField,
  Filter,
  FilterOperator,
  StringKeyOf,
} from "./types";
import {
  CalendarIcon,
  Check,
  ChevronsUpDown,
  GripVertical,
  ListFilter,
  Trash2,
} from "lucide-react";
import { customAlphabet } from "nanoid";
import { useId, useState, useEffect } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FacetedFilter,
  FacetedFilterContent,
  FacetedFilterEmpty,
  FacetedFilterGroup,
  FacetedFilterInput,
  FacetedFilterItem,
  FacetedFilterList,
  FacetedFilterTrigger,
} from "@/components/ui/faceted-filter";
import { Input } from "@/components/ui/input";
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
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { dataTableConfig } from "./config";
import { getDefaultFilterOperator, getFilterOperators } from "./utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BorderBeam } from "@/components/magicui/border-beam";

interface DataTableFilterListProps<TData> {
  filterFields: DataTableFilterField<TData>[];
  onFiltersChange: (filters: Filter<TData>[]) => void;
  activeFilters: Filter<TData>[];
}

export function DataTableFilterList<TData>({
  filterFields,
  onFiltersChange,
  activeFilters,
}: DataTableFilterListProps<TData>) {
  const id = useId();
  const [filters, setFilters] = useState<Filter<TData>[]>(activeFilters);
  const [isFiltersValid, setIsFiltersValid] = useState(true);

  useEffect(() => {
    setFilters(activeFilters);
  }, [activeFilters]);

  const handleConfirm = () => {
    onFiltersChange(filters);
  };

  const handleReset = () => {
    setFilters([]);
    setIsFiltersValid(true);
    onFiltersChange([]);
  };

  function hasConflictingConditions(conditions: Filter<TData>[]): boolean {
    if (conditions.length <= 1) return false;

    const {
      mutuallyExclusive,
      rangeOperators,
      dateSpecialOperators,
      maxRangeConditions,
      similarOperators,
      complementaryOperators,
    } = dataTableConfig.operatorConflicts;

    // 1. 检查互斥操作符
    for (const [op1, op2] of mutuallyExclusive) {
      const hasOp1 = conditions.some((c) => c.operator === op1);
      const hasOp2 = conditions.some((c) => c.operator === op2);
      if (hasOp1 && hasOp2) return true;
    }

    // 2. 检查相同值的互斥条件
    for (const condition1 of conditions) {
      for (const condition2 of conditions) {
        if (condition1 === condition2) continue;

        if (condition1.value === condition2.value) {
          for (const [op1, op2] of mutuallyExclusive) {
            if (
              (condition1.operator === op1 && condition2.operator === op2) ||
              (condition1.operator === op2 && condition2.operator === op1)
            ) {
              return true;
            }
          }
        }
      }
    }

    // 3. 检查范围条件
    const rangeConditions = conditions.filter((c) =>
      rangeOperators.includes(c.operator as (typeof rangeOperators)[number])
    );

    if (rangeConditions.length > maxRangeConditions) return true;

    // 4. 检查数值范围的逻辑冲突
    if (rangeConditions.length > 0) {
      const values = rangeConditions.map((c) => ({
        operator: c.operator,
        value: parseFloat(c.value as string),
      }));

      for (const val1 of values) {
        for (const val2 of values) {
          if (val1 === val2) continue;

          if (
            (val1.operator === "lt" &&
              val2.operator === "gt" &&
              val1.value <= val2.value) ||
            (val1.operator === "lte" &&
              val2.operator === "gte" &&
              val1.value < val2.value) ||
            (val1.operator === "gt" &&
              val2.operator === "lt" &&
              val1.value >= val2.value) ||
            (val1.operator === "gte" &&
              val2.operator === "lte" &&
              val1.value > val2.value)
          ) {
            return true;
          }
        }
      }
    }

    // 5. 检查日期特殊操作符
    const dateSpecialConditions = conditions.filter(
      (c) =>
        c.type === "date" &&
        dateSpecialOperators.includes(
          c.operator as (typeof dateSpecialOperators)[number]
        )
    );
    if (dateSpecialConditions.length > 1) return true;

    // 6. 检查相似条件冲突
    for (const condition1 of conditions) {
      for (const condition2 of conditions) {
        if (condition1 === condition2) continue;

        // 检查值相同的相似条件
        if (condition1.value === condition2.value) {
          // 检查是否属于相同的相似条件组
          for (const group of similarOperators) {
            const inSameGroup =
              group.includes(condition1.operator as never) &&
              group.includes(condition2.operator as never);
            if (inSameGroup) {
              return true; // 发现相似条件冲突
            }
          }

          // 检查互补条件
          for (const [op1, op2] of complementaryOperators) {
            if (
              (condition1.operator === op1 && condition2.operator === op2) ||
              (condition1.operator === op2 && condition2.operator === op1)
            ) {
              return true; // 发现互补条件冲突
            }
          }
        }

        // 检查逻辑上冲突的条件
        if (
          (condition1.operator === "iLike" &&
            condition2.operator === "ne" &&
            condition1.value === condition2.value) ||
          (condition1.operator === "ne" &&
            condition2.operator === "iLike" &&
            condition1.value === condition2.value)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  function validateFilters(newFilters: Filter<TData>[]): boolean {
    // 按字段分组检查条件
    const fieldConditions = new Map<string, Filter<TData>[]>();

    for (const filter of newFilters) {
      const conditions = fieldConditions.get(filter.id) || [];
      conditions.push(filter);
      fieldConditions.set(filter.id, conditions);
    }

    // 检查每个字段的条件是否冲突
    for (const [_, conditions] of fieldConditions) {
      if (hasConflictingConditions(conditions)) {
        return false;
      }
    }

    // 检查重复条件
    for (const filter1 of newFilters) {
      for (const filter2 of newFilters) {
        if (filter1 === filter2) continue;

        // 检查完全相同的条件
        if (
          filter1.id === filter2.id &&
          filter1.operator === filter2.operator &&
          filter1.value === filter2.value
        ) {
          return false;
        }
      }
    }

    return true;
  }

  function addFilter() {
    const filterField = filterFields[0];

    if (!filterField) return;

    const newFilters = [
      ...filters,
      {
        id: filterField.id,
        value: "",
        type: filterField.type,
        operator: getDefaultFilterOperator(filterField.type),
        rowId: customAlphabet(
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
          6
        )(),
      },
    ];

    if (!validateFilters(newFilters)) {
      toast.error("筛选条件存在冲突或重复");
      setIsFiltersValid(false);
      return;
    }

    setIsFiltersValid(true);
    setFilters(newFilters);
  }

  function updateFilter({
    rowId,
    field,
  }: {
    rowId: string;
    field: Omit<Partial<Filter<TData>>, "rowId">;
  }) {
    setFilters((prevFilters) => {
      const updatedFilters = prevFilters.map((filter) => {
        if (filter.rowId === rowId) {
          return { ...filter, ...field };
        }
        return filter;
      });

      if (!validateFilters(updatedFilters)) {
        toast.error("筛选条件存在冲突或重复");
        setIsFiltersValid(false);
        return prevFilters;
      }

      setIsFiltersValid(true);
      return updatedFilters;
    });
  }

  function removeFilter(rowId: string) {
    const updatedFilters = filters.filter((filter) => filter.rowId !== rowId);
    setFilters(updatedFilters);
  }

  function moveFilter(activeIndex: number, overIndex: number) {
    setFilters((prevFilters) => {
      const newFilters = [...prevFilters];
      const [removed] = newFilters.splice(activeIndex, 1);
      if (!removed) return prevFilters;
      newFilters.splice(overIndex, 0, removed);
      return newFilters;
    });
  }

  function getDisabledOperators(
    currentFilter: Filter<TData>,
    allFilters: Filter<TData>[],
    operators: { label: string; value: FilterOperator }[]
  ): Set<FilterOperator> {
    const disabledOperators = new Set<FilterOperator>();
    const sameFieldFilters = allFilters.filter(
      (f) => f.id === currentFilter.id && f.rowId !== currentFilter.rowId
    );

    for (const operator of operators) {
      // 模拟添加这个操作符，检查是否会导致冲突
      const testFilters = sameFieldFilters.concat({
        ...currentFilter,
        operator: operator.value,
      });

      if (hasConflictingConditions(testFilters)) {
        disabledOperators.add(operator.value);
      }
    }

    return disabledOperators;
  }

  function renderFilterInput({
    filter,
    inputId,
  }: {
    filter: Filter<TData>;
    inputId: string;
  }) {
    const filterField = filterFields.find((f) => f.id === filter.id);

    if (!filterField) return null;

    if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
      return (
        <div
          id={inputId}
          role="status"
          aria-live="polite"
          aria-label={`${filterField.label} 筛选器是 ${
            filter.operator === "isEmpty" ? "空" : "非空"
          }`}
          className="h-8 w-full rounded border border-dashed"
        />
      );
    }

    switch (filter.type) {
      case "text":
      case "number":
        return (
          <Input
            id={inputId}
            type={filter.type}
            aria-label={`${filterField.label} 筛选器值`}
            aria-describedby={`${inputId}-description`}
            placeholder={filterField.placeholder ?? "输入一个值..."}
            className="h-8 w-full rounded"
            defaultValue={
              typeof filter.value === "string" ? filter.value : undefined
            }
            onChange={(event) =>
              updateFilter({
                rowId: filter.rowId,
                field: { value: event.target.value },
              })
            }
          />
        );
      case "select":
        return (
          <FacetedFilter>
            <FacetedFilterTrigger asChild>
              <Button
                id={inputId}
                variant="outline"
                size="sm"
                aria-label={`${filterField.label} 筛选器值`}
                aria-controls={`${inputId}-listbox`}
                className="h-8 w-full justify-start gap-2 rounded px-1.5 text-left text-muted-foreground hover:text-muted-foreground"
              >
                {filter.value && typeof filter.value === "string" ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {filterField?.options?.find(
                      (option) => option.value === filter.value
                    )?.label || filter.value}
                  </Badge>
                ) : (
                  <>
                    {filterField.placeholder ?? "选择一个选项..."}
                    <ChevronsUpDown className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </FacetedFilterTrigger>
            <FacetedFilterContent
              id={`${inputId}-listbox`}
              className="w-[12.5rem] origin-[var(--radix-popover-content-transform-origin)]"
            >
              <FacetedFilterInput
                placeholder={filterField?.label ?? "搜索选项..."}
                aria-label={`搜索 ${filterField?.label} 选项`}
              />
              <FacetedFilterList>
                <FacetedFilterEmpty>未找到选项。</FacetedFilterEmpty>
                <FacetedFilterGroup>
                  {filterField?.options?.map((option) => (
                    <FacetedFilterItem
                      key={option.value}
                      value={option.value}
                      selected={filter.value === option.value}
                      onSelect={(value) => {
                        updateFilter({ rowId: filter.rowId, field: { value } });
                      }}
                    >
                      {option.icon && (
                        <option.icon
                          className="mr-2 size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span>{option.label}</span>
                      {option.count && (
                        <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                          {option.count}
                        </span>
                      )}
                    </FacetedFilterItem>
                  ))}
                </FacetedFilterGroup>
              </FacetedFilterList>
            </FacetedFilterContent>
          </FacetedFilter>
        );
      case "multi-select": {
        const selectedValues = new Set(
          Array.isArray(filter.value) ? filter.value : []
        );

        return (
          <FacetedFilter>
            <FacetedFilterTrigger asChild>
              <Button
                id={inputId}
                variant="outline"
                size="sm"
                aria-label={`${filterField.label} 筛选器值`}
                aria-controls={`${inputId}-listbox`}
                className="h-8 w-full justify-start gap-2 rounded px-1.5 text-left text-muted-foreground hover:text-muted-foreground"
              >
                {selectedValues.size === 0 && (
                  <>
                    {filterField.placeholder ?? "选择选项..."}
                    <ChevronsUpDown className="size-4" aria-hidden="true" />
                  </>
                )}
                {selectedValues?.size > 0 && (
                  <div className="flex items-center">
                    <Badge
                      variant="secondary"
                      className="rounded-sm px-1 font-normal lg:hidden"
                    >
                      {selectedValues.size}
                    </Badge>
                    <div className="hidden min-w-0 gap-1 lg:flex">
                      {selectedValues.size > 2 ? (
                        <Badge
                          variant="secondary"
                          className="rounded-sm px-1 font-normal"
                        >
                          {selectedValues.size} selected
                        </Badge>
                      ) : (
                        filterField?.options
                          ?.filter((option) => selectedValues.has(option.value))
                          .map((option) => (
                            <Badge
                              variant="secondary"
                              key={option.value}
                              className="truncate rounded-sm px-1 font-normal"
                            >
                              {option.label}
                            </Badge>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </Button>
            </FacetedFilterTrigger>
            <FacetedFilterContent
              id={`${inputId}-listbox`}
              className="w-[12.5rem] origin-[var(--radix-popover-content-transform-origin)]"
            >
              <FacetedFilterInput
                aria-label={`搜索 ${filterField?.label} 选项`}
                placeholder={filterField?.label ?? "搜索选项..."}
              />
              <FacetedFilterList>
                <FacetedFilterEmpty>未找到选项。</FacetedFilterEmpty>
                <FacetedFilterGroup>
                  {filterField?.options?.map((option) => (
                    <FacetedFilterItem
                      key={option.value}
                      value={option.value}
                      selected={selectedValues.has(option.value)}
                      onSelect={(value) => {
                        const currentValue = Array.isArray(filter.value)
                          ? filter.value
                          : [];
                        const newValue = currentValue.includes(value)
                          ? currentValue.filter((v) => v !== value)
                          : [...currentValue, value];
                        updateFilter({
                          rowId: filter.rowId,
                          field: { value: newValue },
                        });
                      }}
                    >
                      {option.icon && (
                        <option.icon
                          className="mr-2 size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span>{option.label}</span>
                      {option.count && (
                        <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs">
                          {option.count}
                        </span>
                      )}
                    </FacetedFilterItem>
                  ))}
                </FacetedFilterGroup>
              </FacetedFilterList>
            </FacetedFilterContent>
          </FacetedFilter>
        );
      }
      case "date": {
        const dateValue = Array.isArray(filter.value)
          ? filter.value.filter(Boolean)
          : [filter.value, filter.value].filter(Boolean);

        const displayValue =
          filter.operator === "isBetween" && dateValue.length === 2
            ? `${format(new Date(dateValue[0] ?? ""), "yyyy-MM-dd")} - ${format(
                new Date(dateValue[1] ?? ""),
                "yyyy-MM-dd"
              )}`
            : dateValue[0]
            ? format(new Date(dateValue[0]), "yyyy-MM-dd")
            : "选择日期";

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={inputId}
                variant="outline"
                size="sm"
                aria-label={`${filterField.label} 日期筛选器`}
                aria-controls={`${inputId}-calendar`}
                className={cn(
                  "h-8 w-full justify-start gap-2 rounded text-left font-normal",
                  !filter.value && "text-muted-foreground"
                )}
              >
                <CalendarIcon
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">{displayValue}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              id={`${inputId}-calendar`}
              align="start"
              className="w-auto p-0"
            >
              {filter.operator === "isBetween" ? (
                <Calendar
                  id={`${inputId}-calendar`}
                  mode="range"
                  aria-label={`Select ${filterField.label} date range`}
                  selected={
                    dateValue.length === 2
                      ? {
                          from: new Date(dateValue[0] ?? ""),
                          to: new Date(dateValue[1] ?? ""),
                        }
                      : {
                          from: new Date(),
                          to: new Date(),
                        }
                  }
                  onSelect={(date) => {
                    updateFilter({
                      rowId: filter.rowId,
                      field: {
                        value: date
                          ? [
                              date.from?.toISOString() ?? "",
                              date.to?.toISOString() ?? "",
                            ]
                          : [],
                      },
                    });
                  }}
                  initialFocus
                  numberOfMonths={1}
                />
              ) : (
                <Calendar
                  id={`${inputId}-calendar`}
                  mode="single"
                  aria-label={`选择 ${filterField.label} 日期`}
                  selected={dateValue[0] ? new Date(dateValue[0]) : undefined}
                  onSelect={(date) => {
                    updateFilter({
                      rowId: filter.rowId,
                      field: { value: date?.toISOString() ?? "" },
                    });
                  }}
                  initialFocus
                />
              )}
            </PopoverContent>
          </Popover>
        );
      }
      case "boolean": {
        if (Array.isArray(filter.value)) return null;

        return (
          <Select
            value={filter.value}
            onValueChange={(value) =>
              updateFilter({ rowId: filter.rowId, field: { value } })
            }
          >
            <SelectTrigger
              id={inputId}
              aria-label={`${filterField.label} 布尔筛选器`}
              aria-controls={`${inputId}-listbox`}
              className="h-8 w-full rounded bg-transparent"
            >
              <SelectValue placeholder={filter.value ? "True" : "False"} />
            </SelectTrigger>
            <SelectContent id={`${inputId}-listbox`}>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      default:
        return null;
    }
  }

  function isFilterComplete(filter: Filter<TData>): boolean {
    const { noValueRequired } = dataTableConfig.operatorValidation;

    // 检查是否是不需要值的操作符
    if (
      noValueRequired.includes(
        filter.operator as (typeof noValueRequired)[number]
      )
    ) {
      return true;
    }

    // 检查值是否存在且不为空
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0;
    }

    return filter.value !== undefined && filter.value !== "";
  }

  function areAllFiltersComplete(filters: Filter<TData>[]): boolean {
    return filters.every(isFilterComplete);
  }

  return (
    <Sortable
      value={filters}
      getItemValue={(item) => item.rowId}
      onMove={({ activeIndex, overIndex }) =>
        moveFilter(activeIndex, overIndex)
      }
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="打开筛选器"
            aria-controls={`${id}-filter-dialog`}
          >
            <ListFilter className="size-3" aria-hidden="true" />
            筛选
            {activeFilters.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[1.14rem] rounded-[0.2rem] px-[0.32rem] font-mono font-normal text-[0.65rem]"
              >
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          id={`${id}-filter-dialog`}
          align="start"
          collisionPadding={16}
          className={cn(
            "flex w-[calc(100vw-theme(spacing.12))] min-w-60 origin-[var(--radix-popover-content-transform-origin)] flex-col p-4 sm:w-[36rem]",
            filters.length > 0 ? "gap-3.5" : "gap-2"
          )}
        >
          <BorderBeam duration={8} size={100} />
          <div className="flex items-center justify-between">
            {filters.length > 0 ? (
              <h4 className="font-medium leading-none">筛选</h4>
            ) : (
              <div className="flex flex-col gap-1">
                <h4 className="font-medium leading-none">未应用筛选</h4>
                <p className="text-muted-foreground text-sm">
                  添加筛选以细化结果。
                </p>
              </div>
            )}
            <Button
              size="sm"
              className="rounded"
              variant="outline"
              onClick={addFilter}
              disabled={!areAllFiltersComplete(filters) || !isFiltersValid}
            >
              添加
            </Button>
          </div>
          <SortableContent asChild>
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto py-0.5 pr-1">
              {filters.map((filter, index) => {
                const filterId = `${id}-filter-${filter.rowId}`;
                const fieldListboxId = `${filterId}-field-listbox`;
                const fieldTriggerId = `${filterId}-field-trigger`;
                const operatorListboxId = `${filterId}-operator-listbox`;
                const inputId = `${filterId}-input`;

                return (
                  <SortableItem key={filter.rowId} value={filter.rowId} asChild>
                    <div className="flex items-center gap-2">
                      <div className="min-w-[4.5rem] text-center">
                        {index === 0 ? (
                          <span className="text-muted-foreground text-sm">
                            条件
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            并且
                          </span>
                        )}
                      </div>
                      <Popover modal>
                        <PopoverTrigger asChild>
                          <Button
                            id={fieldTriggerId}
                            variant="outline"
                            size="sm"
                            role="combobox"
                            aria-label="选择筛选字段"
                            aria-controls={fieldListboxId}
                            className="h-8 w-32 justify-between gap-2 rounded focus:outline-none focus:ring-1 focus:ring-ring focus-visible:ring-0"
                          >
                            <span className="truncate">
                              {filterFields.find(
                                (field) => field.id === filter.id
                              )?.label ?? "选择字段"}
                            </span>
                            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          id={fieldListboxId}
                          align="start"
                          className="w-40 p-0"
                          onCloseAutoFocus={() =>
                            document.getElementById(fieldTriggerId)?.focus({
                              preventScroll: true,
                            })
                          }
                        >
                          <Command>
                            <CommandInput placeholder="搜索字段..." />
                            <CommandList>
                              <CommandEmpty>未找到字段。</CommandEmpty>
                              <CommandGroup>
                                {filterFields.map((field) => (
                                  <CommandItem
                                    key={field.id}
                                    value={field.id}
                                    onSelect={(value) => {
                                      const filterField = filterFields.find(
                                        (col) => col.id === value
                                      );

                                      if (!filterField) return;

                                      updateFilter({
                                        rowId: filter.rowId,
                                        field: {
                                          id: value as StringKeyOf<TData>,
                                          type: filterField.type,
                                          operator: getDefaultFilterOperator(
                                            filterField.type
                                          ),
                                          value: "",
                                        },
                                      });

                                      document
                                        .getElementById(fieldTriggerId)
                                        ?.click();
                                    }}
                                  >
                                    <span className="mr-1.5 truncate">
                                      {field.label}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-auto size-4 shrink-0",
                                        field.id === filter.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Select
                        value={filter.operator}
                        onValueChange={(value: FilterOperator) =>
                          updateFilter({
                            rowId: filter.rowId,
                            field: {
                              operator: value,
                              value:
                                value === "isEmpty" || value === "isNotEmpty"
                                  ? ""
                                  : filter.value,
                            },
                          })
                        }
                      >
                        <SelectTrigger
                          aria-label="选择筛选操作符"
                          aria-controls={operatorListboxId}
                          className="h-8 w-32 rounded"
                        >
                          <div className="truncate">
                            <SelectValue placeholder={filter.operator} />
                          </div>
                        </SelectTrigger>
                        <SelectContent id={operatorListboxId}>
                          {(() => {
                            const operators = getFilterOperators(filter.type);
                            const disabledOperators = getDisabledOperators(
                              filter,
                              filters,
                              operators
                            );

                            return operators.map((op) => (
                              <SelectItem
                                key={op.value}
                                value={op.value}
                                disabled={disabledOperators.has(op.value)}
                              >
                                {op.label}
                                {disabledOperators.has(op.value) && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (与现有条件冲突)
                                  </span>
                                )}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                      <div className="min-w-36 flex-1">
                        {renderFilterInput({ filter, inputId })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Remove filter ${index + 1}`}
                        className="size-8 shrink-0 rounded"
                        onClick={() => removeFilter(filter.rowId)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                      <SortableItemHandle
                        className="size-8 shrink-0 rounded"
                        asChild
                      >
                        <Button variant="outline" size="icon">
                          <GripVertical
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </Button>
                      </SortableItemHandle>
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContent>
          <div className="flex items-center gap-2">
            {filters.length > 0 && (
              <>
                <Button
                  size="sm"
                  className="rounded"
                  onClick={handleConfirm}
                  disabled={!areAllFiltersComplete(filters) || !isFiltersValid}
                >
                  确认
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded"
                  onClick={handleReset}
                >
                  重置
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 min-w-[4.5rem] rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 w-32 rounded-sm bg-primary/10" />
          <div className="h-8 min-w-36 flex-1 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}
