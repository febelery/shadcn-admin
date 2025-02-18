import { useMemo } from "react";
import { FormField } from "@/pages/form/form.d";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Pagination, PaginationSize } from "@/components/ui/pagination";

interface TableViewProps {
  field: FormField;
  data: any[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function TableView({ field, data, pagination }: TableViewProps) {
  const columns = useMemo(() => {
    if (!data?.length) return [];

    const firstItem = data[0];

    // 处理矩阵类型数据
    if (field.type === "matrix") {
      const optionCount = firstItem.ratings?.length || 0;
      return [
        {
          accessorKey: "question",
          header: () => (
            <div className="text-left font-medium text-muted-foreground">
              问题
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <div className="font-medium">{row.getValue("question")}</div>
          ),
        },
        ...Array.from({ length: optionCount }, (_, index) => ({
          accessorKey: `ratings.${index}`,
          header: () => (
            <div className="text-center font-medium text-muted-foreground">
              选项{index + 1}
            </div>
          ),
          cell: ({ row }: { row: any }) => {
            const ratings = row.original.ratings;
            return (
              <div className="text-center font-medium">
                {ratings[index]?.value || "-"}
              </div>
            );
          },
        })),
      ];
    }

    // 处理评分类型数据
    if (field.type === "rate") {
      return [
        {
          accessorKey: "name",
          header: () => (
            <div className="text-left font-medium text-muted-foreground">
              选项
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <div className="font-medium">{row.getValue("name")}</div>
          ),
        },
        {
          accessorKey: "value",
          header: () => (
            <div className="text-right font-medium text-muted-foreground">
              数量
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <div className="text-right tabular-nums font-medium">
              {row.getValue("value")}
            </div>
          ),
        },
      ];
    }

    // 处理单选/多选统计数据
    if (
      typeof firstItem === "object" &&
      !Array.isArray(firstItem) &&
      "name" in firstItem
    ) {
      return [
        {
          accessorKey: "name",
          header: () => (
            <div className="text-left font-medium text-muted-foreground">
              选项
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <div className="font-medium">{row.getValue("name")}</div>
          ),
        },
        {
          accessorKey: "value",
          header: () => (
            <div className="text-right font-medium text-muted-foreground">
              数量
            </div>
          ),
          cell: ({ row }: { row: any }) => (
            <div className="text-right tabular-nums font-medium">
              {row.getValue("value")}
            </div>
          ),
        },
      ];
    }

    // 处理文本类型数据
    return [
      {
        accessorKey: "content",
        header: () => (
          <div className="text-left font-medium text-muted-foreground">
            内容
          </div>
        ),
        cell: ({ row }: { row: any }) => (
          <div className="whitespace-pre-wrap break-all">{row.original}</div>
        ),
      },
    ];
  }, [data, field.type]);

  const formattedData = useMemo(() => {
    return data;
  }, [data]);

  const table = useReactTable({
    data: formattedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination: {
        pageSize: pagination.pageSize,
        pageIndex: pagination.page - 1,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
  });

  // 计算是否需要显示分页
  const showPagination = useMemo(() => {
    return pagination.total > pagination.pageSize;
  }, [pagination.total, pagination.pageSize]);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-6 text-sm font-medium text-muted-foreground tracking-wide"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-center gap-6 py-4">
          <PaginationSize
            value={pagination.pageSize}
            onValueChange={pagination.onPageSizeChange}
          />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={pagination.onPageChange}
          />
        </div>
      )}
    </>
  );
}
