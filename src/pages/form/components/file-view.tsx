import { FormField } from "@/pages/form/form.d";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationSize } from "@/components/ui/pagination";
import { Download, Loader2 } from "lucide-react";
import { getUrlType, type FileType } from "@/lib/utils";
import { download } from "@/lib/download";
import {
  ImageIcon,
  Video,
  FileText,
  Table2,
  Presentation,
  Music,
  Archive,
  File as FileIcon,
} from "lucide-react";

interface FileViewProps {
  field: FormField;
  data: any[];
  downloadingId: string | null;
  setDownloadingId: (id: string | null) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

// 文件类型图标映射
const FileTypeIcon = ({ type }: { type: FileType }) => {
  switch (type) {
    case "image":
      return <ImageIcon className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "word":
      return <FileText className="h-4 w-4" />;
    case "excel":
      return <Table2 className="h-4 w-4" />;
    case "powerpoint":
      return <Presentation className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    case "text":
      return <FileText className="h-4 w-4" />;
    default:
      return <FileIcon className="h-4 w-4" />;
  }
};

export function FileView({
  field,
  data,
  downloadingId,
  setDownloadingId,
  pagination,
}: FileViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableBody>
          {data.map((files, rowIndex) => {
            const fileCount = files.length;

            return (
              <TableRow
                key={rowIndex}
                className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
              >
                <TableCell className="py-3 pl-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                        共 {fileCount} 个文件
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {files.map((url: string, index: number) => {
                        const fileType = getUrlType(url);
                        const fileName = url.split("/").pop() || "";
                        const displayName =
                          fileName.length > 16
                            ? fileName.slice(0, 10) + "..." + fileName.slice(-6)
                            : fileName;

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <FileTypeIcon type={fileType} />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors truncate max-w-[180px]"
                              title={fileName}
                            >
                              {displayName}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-12 pr-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!downloadingId}
                    onClick={async () => {
                      const downloadId = `${field.key}-${rowIndex}`;
                      try {
                        setDownloadingId(downloadId);
                        await download(
                          files.map((url: string) => ({
                            url,
                            fileName: url.split("/").pop() || "unnamed-file",
                          })),
                          {
                            fileName: `${field.title}-文件打包`,
                            fileType: "zip",
                          }
                        );
                      } catch (error) {
                        console.error("文件下载失败:", error);
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                    className="h-7 w-7 p-0"
                  >
                    {downloadingId === `${field.key}-${rowIndex}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
    </div>
  );
}
