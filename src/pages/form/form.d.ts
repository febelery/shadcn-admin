export const builtFieldTypes = [
  { type: "input", name: "输入" },
  { type: "textarea", name: "多行输入" },
  { type: "radio", name: "单选" },
  { type: "checkbox", name: "多选" },
  { type: "select", name: "下拉选择" },
  { type: "date-time", name: "日期" },
  { type: "matrix", name: "矩阵" },
  { type: "upload", name: "上传文件" },
  { type: "address", name: "地区" },
  { type: "rate", name: "评分" },
  { type: "signature", name: "电子签名" },
  { type: "text", name: "文本" },
  { type: "divider", name: "分割线" },
];

export interface FieldContent {
  min?: number | null;
  max?: number | null;
  valueType?: string | null;
  options?: string[];
  other?: {
    show: boolean;
    text: string;
  } | null;
  presetArea?: string[];
  rows?: string[];
  columns?: string[];
  type?: "radio" | "checkbox";
}

export interface FormField {
  key?: string;
  index: number;
  title: string;
  type: string;
  content?: {
    options?: string[];
    [key: string]: any;
  };
}

export interface FormData {
  title: string;
  desc?: string;
  page_config: {
    header_image?: string;
  };
  fields: FormField[];
}

export interface FilterCondition {
  fieldKey: string;
  operator: string;
  value: string | string[];
  id: string;
}

export interface FilterGroup {
  conditions: FilterCondition[];
  id: string;
  logic: "AND" | "OR";
}

export interface FilterPopoverProps {
  fields: FormField[][];
  onFilterChange: (params: FilterParams) => void;
}

export interface RequestParams {
  page: number;
  page_size: number;
  key: string;
  type: string;
  view?: "table" | "chart";
  chartType?: "pie" | "bar" | "line";
  timeRange?: [string, string];
  groupBy?: string[];
  orderBy?: string;
  order?: "asc" | "desc";
}

export interface FilterParams {
  filter?: Array<{
    mode: string;
    conds: Array<{
      ref: {
        type: string;
        field: string;
      };
      comp: string;
      val: string | string[];
    }>;
  }>;
}
