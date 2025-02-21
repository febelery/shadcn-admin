"use client";

import type { DataTableFilterField } from "./types";
import type { Table } from "@tanstack/react-table";
import type * as React from "react";
import { SortingState } from "@tanstack/react-table";
import { type Filter } from "./types";

import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterFields: DataTableFilterField<TData>[];
  onFiltersChange: (filters: Filter<any>[]) => void;
  onSortingChange: (sorting: SortingState) => void;
  activeFilters: Filter<any>[];
  activeSorting: SortingState;
  children?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  filterFields = [],
  onFiltersChange,
  onSortingChange,
  activeFilters,
  activeSorting,
  children,
  className,
}: DataTableToolbarProps<TData>) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 overflow-auto p-1",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {filterFields.length > 0 && (
          <DataTableFilterList
            filterFields={filterFields}
            onFiltersChange={onFiltersChange}
            activeFilters={activeFilters}
          />
        )}
        <DataTableSortList
          table={table}
          onSortingChange={onSortingChange}
          activeSorting={activeSorting}
        />
      </div>
      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
