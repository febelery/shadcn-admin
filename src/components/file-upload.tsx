import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import { qiniuUptokenApi } from "@/services/common";
import { useState, useEffect } from "react";
import { getUrlType } from "@/lib/utils";

// 注册需要的FilePond插件
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import "filepond-plugin-image-edit/dist/filepond-plugin-image-edit.css";
import "filepond-plugin-media-preview/dist/filepond-plugin-media-preview.min.css";

import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginImageEdit from "filepond-plugin-image-edit";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";
// @ts-ignore
import FilePondPluginMediaPreview from "filepond-plugin-media-preview";

// 导入Doka编辑器(收费产品)
// import "@/assets/doka.min.css";
// // @ts-ignore
// import { create } from "@/assets/doka.esm.min.js";
// const imageEditEditor = create({
//   cropMinImageWidth: 200,
//   cropMinImageHeight: 200,
// });
const imageEditEditor = () => {};

registerPlugin(
  FilePondPluginImageExifOrientation,
  FilePondPluginImagePreview,
  FilePondPluginMediaPreview,
  FilePondPluginFileValidateSize,
  FilePondPluginFileValidateType,
  FilePondPluginImageEdit,
  FilePondPluginImageTransform
);

// 添加中文翻译
const zhCN = {
  labelIdle:
    '拖拽文件或者 <span class="filepond--label-action">点击上传</span>',
  labelInvalidField: "文件类型不正确",
  labelFileWaitingForSize: "计算文件大小",
  labelFileSizeNotAvailable: "文件大小不可用",
  labelFileLoading: "加载中",
  labelFileLoadError: "加载错误",
  labelFileProcessing: "上传中",
  labelFileProcessingComplete: "上传完成",
  labelFileProcessingAborted: "上传取消",
  labelFileProcessingError: "上传错误",
  labelFileProcessingRevertError: "还原错误",
  labelFileRemoveError: "删除错误",
  labelTapToCancel: "点击取消",
  labelTapToRetry: "点击重试",
  labelTapToUndo: "点击撤销",
  labelButtonRemoveItem: "删除",
  labelButtonAbortItemLoad: "中止",
  labelButtonRetryItemLoad: "重试",
  labelButtonAbortItemProcessing: "取消",
  labelButtonUndoItemProcessing: "撤销",
  labelButtonRetryItemProcessing: "重试",
  labelButtonProcessItem: "上传",
  labelFileTypeNotAllowed: "文件类型不允许",

  labelMaxFileSizeExceeded: "文件太大",
  labelMaxFileSize: "最大文件大小是 {filesize}",
  labelMaxTotalFileSizeExceeded: "文件总大小超出限制",
  labelMaxTotalFileSize: "最大文件总大小是 {filesize}",
};

// 优化错误信息映射表命名和结构
const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  "file exists": "文件已存在",
  "bad token": "上传凭证无效",
  "file too large": "文件大小超出限制",
  "invalid file type": "不支持的文件类型",
  "bucket not exist": "存储空间不存在",
  "file type not allowed": "文件类型不允许",
  "token expired": "上传凭证已过期",
  "user canceled": "用户取消上传",
  "network error": "网络连接错误",
};

// 优化延迟函数命名
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 优化 fetch 重试函数
const fetchWithRetries = async (
  url: string,
  maxRetries = 6,
  baseDelay = 1000
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }
  throw new Error("Fetch failed after retries");
};

// 添加 MIME 类型格式验证
type MimeType = `${string}/${string}`; // 例如: "image/png", "video/mp4"

interface FileUploadProps {
  onUploadComplete?: (files: string[] | string) => void;
  accept?: MimeType[] | MimeType;
  multiple?: boolean;
  maxFiles?: number;
  maxTotalFileSize?: string;
  maxFileSize?: string;
  defaultFiles?: string[] | string;
}

/**
/**
 * 文件上传组件
 * @description 基于FilePond实现的文件上传组件,支持图片、视频、文档等多种类型文件的上传,支持预览、编辑等功能
 * @example
 * ```tsx
 * const [fileList, setFileList] = useState<string[]>([]);
 * 
 * <FileUpload
 *   defaultFiles={fileList}
 *   onUploadComplete={(files) => setFileList(files)}
 *   accept={["image/*", "video/*", "application/*"]} 
 *   multiple={true}
 *   maxFiles={5}
 * />
 * ```
 * @param onUploadComplete 上传完成回调,返回所有已上传文件的URL数组
 * @param accept 接受的文件类型,可以是单个mime类型字符串或mime类型数组,如 "image/*" 或 ["image/*", "video/*"]
 * @param multiple 是否允许多选文件,默认为true
 * @param maxFiles 最大允许上传的文件数量,默认为5
 * @param maxTotalFileSize 最大允许的文件总大小,如 "10MB"
 * @param maxFileSize 单个文件最大允许的大小,如 "5MB"
 * @param defaultFiles 默认显示的文件URL数组
 */
export function FileUpload({
  onUploadComplete,
  accept,
  multiple = true,
  maxFiles = 1,
  maxTotalFileSize = undefined,
  maxFileSize = undefined,
  defaultFiles = maxFiles > 1 ? [] : "",
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(() => {
    if (Array.isArray(defaultFiles)) {
      return defaultFiles;
    }
    return defaultFiles ? [defaultFiles] : [];
  });

  useEffect(() => {
    if (onUploadComplete) {
      onUploadComplete(maxFiles > 1 ? uploadedFiles : uploadedFiles[0] || "");
    }
  }, [uploadedFiles, maxFiles, onUploadComplete]);

  useEffect(() => {
    if (Array.isArray(defaultFiles)) {
      setUploadedFiles(defaultFiles);
    } else {
      setUploadedFiles(defaultFiles ? [defaultFiles] : []);
    }
  }, [defaultFiles]);

  const getTranslatedError = (error: string | Error): string => {
    if (typeof error === "string") {
      return UPLOAD_ERROR_MESSAGES[error] || error;
    }
    return error instanceof Error ? error.message : "未知错误";
  };

  // 处理文件上传前的准备工作
  const handleBeforeUpload = async (
    _fieldName: string,
    file: any,
    _metadata: any,
    load: any,
    error: any,
    progress: any,
    abort: any,
    _transfer: any,
    _options: any
  ) => {
    try {
      // 获取七牛上传token
      const data = await qiniuUptokenApi({
        name: file.name,
        size: file.size,
        type: file.type,
        modified: file.lastModified,
      });

      const formData = new FormData();
      formData.append("token", data.uptoken);
      formData.append("file", file);

      const request = new XMLHttpRequest();
      request.open("POST", "https://up-z0.qiniup.com", true);

      request.upload.onprogress = (e) => {
        progress(e.lengthComputable, e.loaded, e.total);
      };

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          load(request.responseText);
        } else {
          const response = JSON.parse(request.responseText);

          error(getTranslatedError(response.error));
        }
      };

      request.send(formData);

      return {
        timeout: 10,
        abort: () => {
          request.abort();
          abort();
        },
      };
    } catch (error: any) {
      error({
        message: getTranslatedError(error),
      });
      return false;
    }
  };

  // 添加文件预览处理函数
  const handleActivateFile = (file: any) => {
    const fileUrl = file.source;
    const fileType = getUrlType(fileUrl);

    // 如果是图片或视频，使用默认预览
    if (["image", "video"].includes(fileType)) {
      return true;
    }

    // 其他类型文件在新窗口打开
    window.open(fileUrl, "_blank");
    return false;
  };

  // 验证 MIME 类型格式
  const validateAcceptedTypes = (types: MimeType[] | MimeType | undefined) => {
    if (!types) return undefined;
    if (typeof types === "string") {
      return [types];
    }
    return types;
  };

  return (
    <div className="filepond-wrapper">
      <FilePond
        // bug: 文件渲染顺序可能和数组顺序不一致
        files={uploadedFiles.map((file) => ({
          source: file,
          options: {
            type: "local",
          },
        }))}
        styleButtonRemoveItemPosition="right"
        allowMultiple={multiple}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        maxTotalFileSize={maxTotalFileSize}
        acceptedFileTypes={validateAcceptedTypes(accept)}
        // 配置图片编辑器
        imageEditEditor={imageEditEditor}
        server={{
          timeout: 1000 * 60 * 5,
          process: handleBeforeUpload,
          load: async (source, load, error) => {
            try {
              const res = await fetchWithRetries(source);
              const blob = await res.blob();
              load(blob);
            } catch (err) {
              error("加载文件失败");
            }
          },
          revert: (source) => {
            const data =
              typeof source === "string" ? JSON.parse(source) : source;

            if (data?.path) {
              setUploadedFiles(
                uploadedFiles.filter((url) => url !== data.path)
              );
            }
          },
          remove: (source) => {
            setUploadedFiles(uploadedFiles.filter((url) => url !== source));
          },
        }}
        onprocessfile={(error, file) => {
          if (error) return;

          let uploadPath = undefined;
          try {
            const response = JSON.parse(file.serverId);
            uploadPath = response.path;
          } catch (error) {
            uploadPath = file.serverId;
          }
          if (!uploadPath) return;

          setUploadedFiles([...uploadedFiles, uploadPath]);
        }}
        onactivatefile={handleActivateFile}
        {...zhCN}
        labelFileProcessingError={(error) => {
          if (typeof error === "object" && error?.body) {
            return `${error.body}`;
          }
          return zhCN.labelFileProcessingError;
        }}
      />
      <style>
        {`
        .filepond--credits {
          display: none !important;
        }
        `}
      </style>
    </div>
  );
}
