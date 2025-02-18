import { useState } from "react";
import {
  type FormField,
  type RequestParams,
  type FilterParams,
  builtFieldTypes,
} from "@/pages/form/form.d";
import { useRequest } from "ahooks";
import { FormStatisticsApi } from "@/services/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ShinyButton } from "@/components/magicui/shiny-button";
import { ChartView } from "./chart-view";
import { TableView } from "./table-view";
import { FileView } from "./file-view";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { download } from "@/lib/download";

interface FieldSectionProps {
  field: FormField;
  downloadingId: string | null;
  setDownloadingId: (id: string | null) => void;
  filterParams: FilterParams;
  className?: string;
}

const CHART_CONFIG = {
  titleMaxLength: 15,
  downloadScale: 2,
  downloadTimeout: 2000,
  supportedTypes: ["radio", "checkbox", "select"],
};

async function waitForChartRender(container: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry?.contentRect.width > 0 && entry.contentRect.height > 0) {
        resizeObserver.disconnect();
        resolve();
      }
    });

    const mutationObserver = new MutationObserver(() => {
      if (container.querySelector(".recharts-wrapper")) {
        mutationObserver.disconnect();
        resolve();
      }
    });

    resizeObserver.observe(container);
    mutationObserver.observe(container, { childList: true, subtree: true });

    setTimeout(() => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      resolve();
    }, CHART_CONFIG.downloadTimeout);
  });
}

export function FieldSection({
  field,
  downloadingId,
  setDownloadingId,
  filterParams,
  className,
}: FieldSectionProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [queryParams, setQueryParams] = useState<RequestParams>({
    page: 1,
    page_size: 10,
    key: field.key ?? "",
    type: field.type,
    view: "table",
    chartType: "pie",
  });

  const { data, loading, error } = useRequest<any, Error[]>(
    () => FormStatisticsApi(field.key ?? "", queryParams, filterParams),
    {
      refreshDeps: [JSON.stringify(queryParams), JSON.stringify(filterParams)],
    }
  );

  const updatePagination = {
    page: (newPage: number) =>
      setQueryParams({ ...queryParams, page: newPage }),
    pageSize: (newSize: number) =>
      setQueryParams({ ...queryParams, page_size: newSize }),
  };

  const handleDownloadChart = async () => {
    if (downloadingId) return;

    try {
      setDownloadingId(field.key || null);
      const chartContainer = document.querySelector(
        `#chart-${field.key}`
      ) as HTMLElement;
      if (!chartContainer) throw new Error("Chart container not found");

      await waitForChartRender(chartContainer);
      const canvas = await html2canvas(chartContainer, {
        backgroundColor: "white",
        scale: CHART_CONFIG.downloadScale,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (doc) => {
          const clone = doc.querySelector(`#chart-${field.key}`);
          if (clone) {
            Object.assign((clone as HTMLElement).style, {
              width: `${chartContainer.offsetWidth}px`,
              height: `${chartContainer.offsetHeight}px`,
            });
          }
        },
      });

      const title =
        field.title.slice(0, CHART_CONFIG.titleMaxLength) +
        (field.title.length > CHART_CONFIG.titleMaxLength ? "..." : "");

      await download(canvas, {
        fileName: title,
        fileType: "png",
        mimeType: "image/png",
      });
    } catch (err) {
      console.error("Failed to download chart:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const renderContent = () => {
    const paginationProps = {
      page: queryParams.page,
      pageSize: queryParams.page_size,
      total: data?.meta.total,
      onPageChange: updatePagination.page,
      onPageSizeChange: updatePagination.pageSize,
    };

    if (CHART_CONFIG.supportedTypes.includes(field.type)) {
      return viewMode === "chart" ? (
        <ChartView field={field} data={data.data} />
      ) : (
        <TableView
          field={field}
          data={data.data}
          pagination={paginationProps}
        />
      );
    }

    if (field.type === "upload") {
      return (
        <FileView
          field={field}
          data={data.data}
          downloadingId={downloadingId}
          setDownloadingId={setDownloadingId}
          pagination={paginationProps}
        />
      );
    }

    return (
      <TableView field={field} data={data.data} pagination={paginationProps} />
    );
  };

  if (loading || error) {
    return (
      <Card
        className={cn("mb-8 relative", className)}
        id={field.key || undefined}
      >
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3">
            {field.index}. {field.title}
            <span className="rounded-full border px-2.5 py-0.5 text-xs bg-primary/10 text-primary">
              {builtFieldTypes.find((f) => f.type === field.type)?.name ||
                field.type}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[200px]">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>加载中...</span>
            </div>
          ) : (
            <div className="text-destructive">
              数据加载失败，请稍后重试{error?.message}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("mb-8 relative", className)}
      id={field.key || undefined}
    >
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
      />
      <CardHeader className="flex flex-row items-center justify-between relative">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-3">
            {field.index}. {field.title}
            <span className="rounded-full border px-2.5 py-0.5 text-xs bg-primary/10 text-primary">
              {builtFieldTypes.find((f) => f.type === field.type)?.name ||
                field.type}
            </span>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {CHART_CONFIG.supportedTypes.includes(field.type) &&
            viewMode === "chart" && (
              <Button
                variant="ghost"
                disabled={!!downloadingId}
                onClick={handleDownloadChart}
                className="h-9 w-9"
                title="下载图表"
              >
                {downloadingId === field.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            )}
          {CHART_CONFIG.supportedTypes.includes(field.type) && (
            <ShinyButton
              onClick={() =>
                setViewMode(viewMode === "chart" ? "table" : "chart")
              }
              className="flex items-center gap-2"
            >
              {viewMode === "chart" ? <>图形</> : <>表格</>}
            </ShinyButton>
          )}
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
