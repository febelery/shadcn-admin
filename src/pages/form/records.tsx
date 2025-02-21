import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterField } from "@/components/data-table/types";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  Circle,
  CircleOff,
  HelpCircle,
  Timer,
} from "lucide-react";

import { FormRecordApi } from "@/services/form";

export default function FormRecords() {
  const formId = "xxx";

  const statuses = [
    {
      value: "backlog",
      label: "Backlog",
      icon: HelpCircle,
    },
    {
      value: "todo",
      label: "Todo",
      icon: Circle,
    },
    {
      value: "in progress",
      label: "In Progress",
      icon: Timer,
    },
    {
      value: "done",
      label: "Done",
      icon: CheckCircle,
    },
    {
      value: "canceled",
      label: "Canceled",
      icon: CircleOff,
    },
  ];

  const priorities = [
    {
      label: "Low",
      value: "low",
      icon: ArrowDown,
    },
    {
      label: "Medium",
      value: "medium",
      icon: ArrowRight,
    },
    {
      label: "High",
      value: "high",
      icon: ArrowUp,
    },
  ];

  const columns: ColumnDef<string, string>[] = [
    // {
    //   id: "select",
    //   header: ({ table }) => (
    //     <Checkbox
    //       checked={
    //         table.getIsAllPageRowsSelected() ||
    //         (table.getIsSomePageRowsSelected() && "indeterminate")
    //       }
    //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    //       aria-label="Select all"
    //       className="translate-y-[2px]"
    //     />
    //   ),
    //   cell: ({ row }) => (
    //     <Checkbox
    //       checked={row.getIsSelected()}
    //       onCheckedChange={(value) => row.toggleSelected(!!value)}
    //       aria-label="Select row"
    //       className="translate-y-[2px]"
    //     />
    //   ),
    //   enableSorting: false,
    //   enableHiding: false,
    // },
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="任务" />
      ),
      cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              Ross | {row.getValue("title")}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "image",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="图片"
          className="text-center max-w-10"
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center">
            {(row.getValue("image") as string) && (
              <img
                src={row.getValue("image")}
                alt="图片"
                className="h-10 w-10 rounded-full"
                onClick={() => {
                  window.open(row.getValue("image") as string, "_blank");
                }}
              />
            )}
          </div>
        );
      },
      enableSorting: true,
      enableColumnFilter: false,
      enablePinning: false,
      enableHiding: false,
    },
    {
      accessorKey: "title-2",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title副本" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              Ross | {row.getValue("title")}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title-3",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title副本2" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              Ross | {row.getValue("title")}
            </span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        );

        if (!status) {
          return null;
        }

        return (
          <div className="flex w-[100px] items-center">
            {status.icon && (
              <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            <span>{status.label}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="优先级" />
      ),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        );

        if (!priority) {
          return null;
        }

        return (
          <div className="flex items-center">
            {priority.icon && (
              <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            <span>{priority.label}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      enablePinning: false,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          menuItems={[
            {
              label: "编辑",
              action: (row) => {
                console.log(row);
              },
              // icon: Edit,
              shortcut: "⌘E",
            },
            {
              label: "删除",
              action: (row) => {
                console.log(row);
              },
              // icon: Trash,
              shortcut: "⌘⌫",
            },
          ]}
          subMenus={[
            {
              label: "状态",
              options: statuses,
              currentValue: row.getValue("status"),
              onChange: (value, row) => {
                console.log(value, row);
              },
            },
            {
              label: "优先级",
              options: priorities,
              currentValue: row.getValue("priority"),
              onChange: (value, row) => {
                console.log(value, row);
              },
            },
          ]}
        />
      ),
      enablePinning: true,
    },
  ];

  const filterFields: DataTableFilterField<any>[] = [
    {
      id: "title",
      label: "标题",
      type: "text",
      placeholder: "请输入标题",
    },
    {
      id: "createdAt",
      label: "创建时间",
      type: "date",
    },
  ];

  return (
    <div className="m-3">
      <DataTable
        columns={columns}
        filterFields={filterFields}
        queryKey={["form-record", formId]}
        queryFn={async (params) => {
          const response = await FormRecordApi(formId, params);
          return response;
        }}
      />
    </div>
  );
}
