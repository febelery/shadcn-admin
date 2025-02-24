"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getColumnTitle } from "./utils";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { GripVertical } from "lucide-react";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const visibleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== "undefined" && column.getCanHide()
    );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    visibleColumns.map((col) => col.id)
  );

  const orderedColumns = [...visibleColumns].sort(
    (a, b) => columnOrder.indexOf(a.id) - columnOrder.indexOf(b.id)
  );

  const handleColumnOrderChange = (newOrder: string[]) => {
    setColumnOrder(newOrder);
    table.setColumnOrder(newOrder);
  };

  return (
    visibleColumns.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
          >
            <Settings2 className="mr-2 h-4 w-4" />
            显示
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>显示列</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Sortable
            value={columnOrder}
            onValueChange={handleColumnOrderChange}
            getItemValue={(item) => item}
          >
            <SortableContent className="max-h-[400px] overflow-y-auto">
              {orderedColumns.map((column) => {
                const isChecked = column.getIsVisible();
                return (
                  <SortableItem key={column.id} value={column.id}>
                    <div className="flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded-sm">
                      <DropdownMenuCheckboxItem
                        checked={isChecked}
                        onCheckedChange={(value) => {
                          column.toggleVisibility(!!value);
                        }}
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                        className="flex-1 cursor-pointer"
                      >
                        {getColumnTitle(column)}
                      </DropdownMenuCheckboxItem>
                      {isChecked && (
                        <SortableItemHandle asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <GripVertical className="h-3 w-3" />
                          </Button>
                        </SortableItemHandle>
                      )}
                    </div>
                  </SortableItem>
                );
              })}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const column = visibleColumns.find((col) => col.id === value);
                return (
                  <div className="flex items-center gap-2 rounded-md border bg-popover px-4 py-2 shadow-md">
                    <span className="flex-1 font-medium">
                      {column ? getColumnTitle(column) : "未知列"}
                    </span>
                    <GripVertical className="h-4 w-4 opacity-50" />
                  </div>
                );
              }}
            </SortableOverlay>
          </Sortable>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
}
