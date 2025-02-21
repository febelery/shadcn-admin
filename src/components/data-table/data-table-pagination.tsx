import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePaginationProps } from "./types";

export function DataTablePagination<TData>({
  table,
  meta,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        共 {meta.total} 条数据
      </div>
      <div className="flex items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">每页</p>
          <Select
            value={`${meta.page_size}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={`${meta.page_size}`} />
            </SelectTrigger>
            <SelectContent side="top" className="min-w-[70px]">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={meta.page === 1}
          >
            <span className="sr-only">跳转到第一页</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.previousPage()}
            disabled={meta.page === 1}
          >
            <span className="sr-only">上一页</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={`${meta.page}`}
            onValueChange={(value) => table.setPageIndex(Number(value) - 1)}
          >
            <SelectTrigger className="h-8 w-[50px] [&>svg]:hidden flex justify-center">
              <SelectValue placeholder={`${meta.page}`} />
            </SelectTrigger>
            <SelectContent side="top" className="max-h-[200px]">
              {Array.from(
                { length: meta.page_total || 0 },
                (_, i) => i + 1
              ).map((pageIndex) => (
                <SelectItem key={pageIndex} value={`${pageIndex}`}>
                  {pageIndex}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => table.nextPage()}
            disabled={meta.page === meta.page_total}
          >
            <span className="sr-only">下一页</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => table.setPageIndex(meta.page_total || 0 - 1)}
            disabled={meta.page === meta.page_total}
          >
            <span className="sr-only">跳转到最后一页</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          共 <span className="mx-1">{meta.page_total || 0}</span> 页
        </div>
      </div>
    </div>
  );
}
