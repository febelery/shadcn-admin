"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { type Filter, type QueryParams, type DataTableProps } from "./types";
import { cn } from "@/lib/utils";

export function DataTable<TData, TValue>({
  columns,
  filterFields = [],
  toolbarContent,
  showPagination = true,
  queryKey,
  queryFn,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // 修改内部状态管理
  const [activeFilters, setActiveFilters] = useState<Filter<TData>[]>([]);
  const [activeSorting, setActiveSorting] = useState<SortingState>([]);

  // 修改查询参数状态
  const [queryParams, setQueryParams] = useState<QueryParams>({
    filters: [],
    sorting: [],
    page: 1,
    page_size: 20,
  });

  // 使用 react-query 进行数据请求
  const {
    data: queryResult,
    isLoading,
    error,
  } = useQuery({
    queryKey: [queryKey, queryParams],
    queryFn: async () => queryFn(queryParams),
  });

  const tableData = queryResult?.data || [];
  const meta = queryResult?.meta;

  const leftPin = columns
    .filter(
      (col) => col.enablePinning && columns.indexOf(col) < columns.length * 0.4
    )
    .map((col: any) => col.id || String(col.accessorKey));

  const rightPin = columns
    .filter(
      (col) => col.enablePinning && columns.indexOf(col) >= columns.length * 0.6
    )
    .map((col: any) => col.id || String(col.accessorKey));

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: meta?.page - 1,
        pageSize: meta?.page_size,
      },
    },
    pageCount: meta?.page_total,
    manualPagination: true,
    initialState: {
      columnPinning: {
        left: leftPin,
        right: rightPin,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newPagination = updater({
          pageIndex: meta?.page - 1,
          pageSize: meta?.page_size,
        });
        handlePaginationChange({
          page: newPagination.pageIndex + 1,
          page_size: newPagination.pageSize,
        });
      } else {
        handlePaginationChange({
          page: updater.pageIndex + 1,
          page_size: updater.pageSize,
        });
      }
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // 处理筛选变化
  const handleFiltersChange = (newFilters: Filter<TData>[]) => {
    setActiveFilters(newFilters);
    setQueryParams((prev) => ({
      ...prev,
      filters: newFilters,
    }));
  };

  // 处理排序变化
  const handleSortingChange = (newSorting: SortingState) => {
    setActiveSorting(newSorting);
    setQueryParams((prev) => ({
      ...prev,
      sorting: newSorting,
    }));
  };

  // 确保初始状态同步
  useEffect(() => {
    if (queryParams.filters?.length) {
      setActiveFilters(queryParams.filters);
    }
    if (queryParams.sorting?.length) {
      setActiveSorting(queryParams.sorting);
    }
  }, [queryParams]);

  // 处理分页变化
  const handlePaginationChange = (newPagination: object) => {
    setQueryParams((prev) => ({
      ...prev,
      ...newPagination,
    }));
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 错误处理
  if (error) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <XCircle className="h-8 w-8" />
          <p>加载失败</p>
          <p className="text-sm text-muted-foreground">
            {(error as Error).message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        filterFields={filterFields}
        onFiltersChange={handleFiltersChange}
        onSortingChange={handleSortingChange}
        activeFilters={activeFilters}
        activeSorting={activeSorting}
      >
        {toolbarContent}
      </DataTableToolbar>
      <div className="rounded-md border m-auto">
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          header.column.getIsPinned() === "left" &&
                            "sticky left-0 z-50 bg-background",
                          header.column.getIsPinned() === "right" &&
                            "sticky right-0 z-50 bg-background"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      //bug: 对于多个pinned的列，会出现sticky重叠
                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.getIsPinned() == "left" &&
                              `sticky left-0 z-50 bg-background dark:shadow-[inset_-8px_0_8px_-4px_rgba(255,255,255,0.05)] shadow-[inset_-8px_0_8px_-4px_rgba(0,0,0,0.05)]`,
                            cell.column.getIsPinned() == "right" &&
                              `sticky right-0 z-50 bg-background dark:shadow-[inset_8px_0_8px_-4px_rgba(255,255,255,0.05)] shadow-[inset_8px_0_8px_-4px_rgba(0,0,0,0.05)]`
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    没有数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {showPagination && <DataTablePagination table={table} meta={meta} />}
    </div>
  );
}
