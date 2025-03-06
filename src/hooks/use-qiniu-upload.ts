import { qiniuUptokenApi } from "@/services/common";

interface QiniuUploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  modified: number;
}

export const useQiniuUpload = () => {
  const uploadToQiniu = async (
    file: File,
    options: QiniuUploadOptions = {}
  ) => {
    const { onProgress, onSuccess, onError } = options;

    try {
      // 获取上传凭证
      const data = await qiniuUptokenApi({
        name: file.name,
        size: file.size,
        type: file.type,
        modified: file.lastModified,
      });

      const formData = new FormData();
      formData.append("token", data.uptoken);
      formData.append("file", file);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://up-z0.qiniup.com", true);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress((e.loaded / e.total) * 100);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            onSuccess?.(response);
            resolve(response);
          } else {
            const error = getTranslatedError(xhr.responseText);
            onError?.(error);
            reject(error);
          }
        };

        xhr.onerror = () => {
          const error = "网络错误";
          onError?.(error);
          reject(error);
        };

        xhr.send(formData);
      });
    } catch (error: any) {
      const errorMessage = getTranslatedError(error);
      onError?.(errorMessage);
      throw errorMessage;
    }
  };

  return { uploadToQiniu };
};

// 错误信息映射
const ERROR_MESSAGES: Record<string, string> = {
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

const getTranslatedError = (error: string | Error): string => {
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      return ERROR_MESSAGES[parsed.error] || parsed.error;
    } catch {
      return ERROR_MESSAGES[error] || error;
    }
  }
  return error instanceof Error ? error.message : "未知错误";
};
