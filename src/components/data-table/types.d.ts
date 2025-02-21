import type {
  ColumnSort,
  Row,
  ColumnDef,
  SortingState,
  Table,
} from "@tanstack/react-table";
import type { z } from "zod";
import type { DataTableConfig } from "./config";

import type { filterSchema } from "./utils";
import { dataTableConfig } from "./config";

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type StringKeyOf<TData> = Extract<keyof TData, string>;

export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: StringKeyOf<TData>;
}

export type ExtendedSortingState<TData> = ExtendedColumnSort<TData>[];

export type ColumnType = DataTableConfig["columnTypes"][number];

export type FilterOperator = DataTableConfig["globalOperators"][number];

export type JoinOperator = DataTableConfig["joinOperators"][number]["value"];

export interface DataTableFilterField<TData> {
  id: StringKeyOf<TData>;
  label: string;
  type: ColumnType;
  placeholder?: string;
  options?: Option[];
}

export type TableColumnDef<TData, TValue = unknown> = ColumnDef<
  TData,
  TValue
> & {
  fixed?: "left" | "right";
  accessorKey?: keyof TData | string;
  id?: string;
  width?: number;
};

export type Filter<TData> = {
  id: StringKeyOf<TData>;
  value: string | string[];
  type: ColumnType;
  operator: FilterOperator;
  rowId: string;
};

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  type: "update" | "delete";
}

export interface QueryBuilderOpts {
  where?: string;
  orderBy?: string;
  distinct?: boolean;
  nullish?: boolean;
}

export interface QueryParams {
  filters?: Filter<any>[];
  sorting?: SortingState;

  page?: PaginationParams["page"];
  page_size?: PaginationParams["page_size"];
}

export interface ApiResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  meta: {
    page?: number;
    page_size?: number;
    page_total?: number;
    total?: number;
  };
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  filterFields: DataTableFilterField<TData>[];
  toolbarContent?: React.ReactNode;
  showPagination?: boolean;
  queryKey: string | readonly unknown[];
  queryFn: (params: QueryParams) => Promise<ApiResponse<TData>>;
}

export type ColumnPosition = {
  position: "left" | "right";
  offset: number;
  isEdgeColumn: boolean;
};

export type ColumnPositions = Record<string, ColumnPosition | null>;
