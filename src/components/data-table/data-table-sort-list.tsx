"use client";

import type { SortDirection, Table, SortingState } from "@tanstack/react-table";
import {
  ArrowDownUp,
  Check,
  ChevronsUpDown,
  GripVertical,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

import { cn } from "@/lib/utils";
import { getColumnTitle } from "./utils";

interface DataTableSortListProps<TData> {
  table: Table<TData>;
  onSortingChange: (sorting: SortingState) => void;
  activeSorting: SortingState;
}

export function DataTableSortList<TData>({
  table,
  onSortingChange,
  activeSorting,
}: DataTableSortListProps<TData>) {
  const id = React.useId();
  const [sorting, setSorting] = useState<SortingState>(activeSorting);
  const initialSorting = (table.initialState.sorting ?? []) as SortingState;

  const uniqueSorting = React.useMemo(
    () =>
      sorting.filter(
        (sort, index, self) => index === self.findIndex((t) => t.id === sort.id)
      ),
    [sorting]
  );

  const debouncedSetSorting = useDebouncedCallback(setSorting, 500);

  const sortableColumns = React.useMemo(
    () =>
      table
        .getAllColumns()
        .filter(
          (column) =>
            column.getCanSort() && !sorting.some((s) => s.id === column.id)
        )
        .map((column) => ({
          id: column.id,
          label: getColumnTitle(column),
          selected: false,
        })),
    [sorting, table]
  );

  useEffect(() => {
    setSorting(activeSorting);
  }, [activeSorting]);

  function isSortingComplete(sort: SortingState[number]): boolean {
    return sort.id !== undefined && sort.desc !== undefined;
  }

  function areAllSortingComplete(sorts: SortingState): boolean {
    return sorts.every(isSortingComplete);
  }

  function addSort() {
    const firstAvailableColumn = sortableColumns.find(
      (column) => !sorting.some((s) => s.id === column.id)
    );
    if (!firstAvailableColumn) return;

    void setSorting([
      ...sorting,
      {
        id: firstAvailableColumn.id,
        desc: false,
      },
    ]);
  }

  function updateSort({
    id,
    field,
    debounced = false,
  }: {
    id: string;
    field: Partial<SortingState[number]>;
    debounced?: boolean;
  }) {
    const updateFunction = debounced ? debouncedSetSorting : setSorting;

    updateFunction((prevSorting) => {
      if (!prevSorting) return prevSorting;

      const updatedSorting = prevSorting.map((sort) =>
        sort.id === id ? { ...sort, ...field } : sort
      );
      return updatedSorting;
    });
  }

  function removeSort(id: string) {
    void setSorting((prevSorting) =>
      prevSorting.filter((item) => item.id !== id)
    );
  }

  const handleConfirm = () => {
    onSortingChange(sorting);
  };

  const handleReset = () => {
    setSorting([]);
    onSortingChange([]);
  };

  return (
    sortableColumns.length > 0 && (
      <Sortable
        value={sorting}
        onValueChange={setSorting}
        getItemValue={(item) => item.id}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label="Open sorting"
              aria-controls={`${id}-sort-dialog`}
            >
              <ArrowDownUp className="size-3" aria-hidden="true" />
              排序
              {uniqueSorting.length > 0 && (
                <Badge
                  variant="secondary"
                  className="h-[1.14rem] rounded-[0.2rem] px-[0.32rem] font-mono font-normal text-[0.65rem]"
                >
                  {uniqueSorting.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={`${id}-sort-dialog`}
            align="start"
            collisionPadding={16}
            className={cn(
              "flex w-[calc(100vw-theme(spacing.20))] min-w-72 max-w-[25rem] origin-[var(--radix-popover-content-transform-origin)] flex-col p-4 sm:w-[25rem]",
              sorting.length > 0 ? "gap-3.5" : "gap-2"
            )}
          >
            <div className="flex items-center justify-between">
              {sorting.length > 0 ? (
                <h4 className="font-medium leading-none">排序</h4>
              ) : (
                <div className="flex flex-col gap-1">
                  <h4 className="font-medium leading-none">未排序</h4>
                  <p className="text-muted-foreground text-sm">
                    添加排序以组织您的结果。
                  </p>
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded"
                onClick={addSort}
                disabled={
                  !areAllSortingComplete(sorting) ||
                  sorting.length >= sortableColumns.length
                }
              >
                添加
              </Button>
            </div>
            <SortableContent asChild>
              <div className="flex max-h-40 flex-col gap-2 overflow-y-auto p-0.5">
                {uniqueSorting.map((sort) => {
                  const sortId = `${id}-sort-${sort.id}`;
                  const fieldListboxId = `${sortId}-field-listbox`;
                  const fieldTriggerId = `${sortId}-field-trigger`;
                  const directionListboxId = `${sortId}-direction-listbox`;

                  const column = table.getColumn(sort.id);
                  const columnTitle = getColumnTitle(column);

                  return (
                    <SortableItem key={sort.id} value={sort.id} asChild>
                      <div className="flex items-center gap-2">
                        <Popover modal>
                          <PopoverTrigger asChild>
                            <Button
                              id={fieldTriggerId}
                              variant="outline"
                              size="sm"
                              role="combobox"
                              className="h-8 w-44 justify-between gap-2 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                              aria-controls={fieldListboxId}
                            >
                              <span className="truncate">{columnTitle}</span>
                              <div className="ml-auto flex items-center gap-1">
                                {initialSorting.length === 1 &&
                                initialSorting[0]?.id === sort.id ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-[1.125rem] rounded px-1 font-mono font-normal text-[0.65rem]"
                                  >
                                    默认
                                  </Badge>
                                ) : null}
                                <ChevronsUpDown
                                  className="size-4 shrink-0 opacity-50"
                                  aria-hidden="true"
                                />
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            id={fieldListboxId}
                            className="w-[var(--radix-popover-trigger-width)] p-0"
                            onCloseAutoFocus={() =>
                              document.getElementById(fieldTriggerId)?.focus()
                            }
                          >
                            <Command>
                              <CommandInput placeholder="查找字段..." />
                              <CommandList>
                                <CommandEmpty>未找到字段。</CommandEmpty>
                                <CommandGroup>
                                  {sortableColumns.map((column) => (
                                    <CommandItem
                                      key={column.id}
                                      value={column.id}
                                      onSelect={(value) => {
                                        const newFieldTriggerId = `${id}-sort-${value}-field-trigger`;

                                        updateSort({
                                          id: sort.id,
                                          field: {
                                            id: value,
                                          },
                                        });

                                        requestAnimationFrame(() => {
                                          document
                                            .getElementById(newFieldTriggerId)
                                            ?.focus();
                                        });
                                      }}
                                    >
                                      <span className="mr-1.5 truncate">
                                        {column.label}
                                      </span>
                                      <Check
                                        className={cn(
                                          "ml-auto size-4 shrink-0",
                                          column.id === sort.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        aria-hidden="true"
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Select
                          value={sort.desc ? "desc" : "asc"}
                          onValueChange={(value: SortDirection) =>
                            updateSort({
                              id: sort.id,
                              field: { id: sort.id, desc: value === "desc" },
                            })
                          }
                        >
                          <SelectTrigger
                            aria-label="Select sort direction"
                            aria-controls={directionListboxId}
                            className="h-8 w-24 rounded"
                          >
                            <div className="truncate">
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent
                            id={directionListboxId}
                            className="min-w-[var(--radix-select-trigger-width)]"
                          >
                            {dataTableConfig.sortOrders.map((order) => (
                              <SelectItem key={order.value} value={order.value}>
                                {order.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={`Remove sort ${sort.id}`}
                          className="size-8 shrink-0 rounded"
                          onClick={() => removeSort(sort.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </Button>
                        <SortableItemHandle asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 shrink-0 rounded"
                          >
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
            {sorting.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="rounded"
                  onClick={handleConfirm}
                  disabled={!areAllSortingComplete(sorting)}
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
              </div>
            )}
          </PopoverContent>
        </Popover>
        <SortableOverlay>
          <div className="flex items-center gap-2">
            <div className="h-8 w-[11.25rem] rounded-sm bg-primary/10" />
            <div className="h-8 w-24 rounded-sm bg-primary/10" />
            <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
            <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          </div>
        </SortableOverlay>
      </Sortable>
    )
  );
}
