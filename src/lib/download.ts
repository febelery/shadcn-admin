import JSZip from "jszip";

// 文件下载的通用配置类型
export interface DownloadOptions {
  fileName?: string;
  fileType?: string;
  mimeType?: string;
}

// 定义下载内容的联合类型
export type DownloadContent =
  | string // URL字符串
  | Blob
  | HTMLCanvasElement
  | Array<string | { url: string; fileName: string }>; // 支持URL数组或带文件名的配置数组

/**
 * 统一的下载入口
 * @param content 下载内容：URL、Blob、Canvas或它们的数组
 * @param options 下载选项
 */
export async function download(
  content: DownloadContent,
  options: DownloadOptions = {}
): Promise<void> {
  try {
    // 处理数组类型 - 批量下载
    if (Array.isArray(content)) {
      if (content.length === 0) {
        throw new Error("下载内容不能为空数组");
      }

      // 如果只有一个文件，直接下载该文件，不需要打包
      if (content.length === 1) {
        const item = content[0];
        const singleContent = typeof item === "string" ? item : item.url;
        const originalFileName =
          typeof item === "string"
            ? singleContent.split("/").pop() || "download"
            : item.fileName;

        // 直接获取单个文件并下载
        const response = await fetch(singleContent);
        if (!response.ok) throw new Error(`Failed to fetch ${singleContent}`);
        const blob = await response.blob();

        // 使用原始文件名，不添加额外的扩展名
        return handleBlobDownload(blob, {
          fileName: originalFileName,
          // 不设置 fileType，让文件保持原有扩展名
        });
      }

      // 处理多文件下载，将其打包成zip
      const zip = new JSZip();

      // 创建所有文件的下载 Promise
      const downloadPromises = content.map(async (item) => {
        const { url, fileName } =
          typeof item === "string"
            ? {
                url: item,
                fileName: item.split("/").pop() || "unnamed-file",
              }
            : item;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch ${url}`);
          const blob = await response.blob();

          // 获取文件扩展名
          const ext = fileName.includes(".")
            ? ""
            : `.${blob.type.split("/").pop()}`;

          // 添加到 zip
          await zip.file(fileName + ext, blob);
        } catch (error) {
          console.error(`Failed to download file: ${url}`, error);
          throw error;
        }
      });

      try {
        // 等待所有文件下载完成
        await Promise.all(downloadPromises);

        // 生成 zip 文件并下载
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: {
            level: 9,
          },
        });

        return handleBlobDownload(zipBlob, {
          fileName: options.fileName || "download",
          fileType: "zip",
        });
      } catch (error) {
        console.error("Failed to create zip file:", error);
        throw error;
      }
    }

    // 处理 URL 字符串
    if (typeof content === "string") {
      const response = await fetch(content);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const ext = options.fileType || blob.type.split("/").pop();
      return handleBlobDownload(blob, {
        ...options,
        fileName: options.fileName || content.split("/").pop() || "download",
        fileType: ext,
      });
    }

    // 处理 Canvas 元素
    if (content instanceof HTMLCanvasElement) {
      try {
        const { mimeType = "image/png" } = options;
        const dataUrl = content.toDataURL(mimeType);
        const response = await fetch(dataUrl);
        const blob = await response.blob();

        return handleBlobDownload(blob, {
          ...options,
          fileName: options.fileName || "chart",
          fileType: options.fileType || "png",
        });
      } catch (error) {
        console.error("Failed to process canvas:", error);
        throw error;
      }
    }

    // 处理 Blob 数据
    if (content instanceof Blob) {
      const ext = options.fileType || content.type.split("/").pop();
      return handleBlobDownload(content, {
        ...options,
        fileType: ext,
      });
    }

    throw new Error("不支持的下载内容类型");
  } catch (error) {
    console.error("Download failed:", error);
    throw error;
  }
}

// 内部工具函数：处理 Blob 下载
function handleBlobDownload(blob: Blob, options: DownloadOptions): void {
  try {
    const { fileName = "download", fileType } = options;
    // 如果文件名已经包含扩展名，或者没有指定 fileType，就使用原始文件名
    const finalFileName =
      fileName.includes(".") || !fileType
        ? fileName
        : `${fileName}.${fileType}`;

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = finalFileName;
    document.body.appendChild(link);

    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 0);
  } catch (error) {
    console.error("Failed to download blob:", error);
    throw error;
  }
}

// 内部工具函数：处理 DataURL 下载
function handleDataUrlDownload(
  dataUrl: string,
  options: DownloadOptions
): void {
  const { fileName = "download", fileType = "png" } = options;
  triggerDownload(dataUrl, `${fileName}.${fileType}`);
}

// 内部工具函数：触发下载
function triggerDownload(url: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
