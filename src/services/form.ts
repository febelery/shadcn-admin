import axios from "axios";
import qs from "query-string";

export const FormApi = (formId: string): any => {
  return axios.get(`/form/${formId}`);
};

export const FormStatisticsApi = (
  formId: string,
  queries: {
    page: number;
    page_size: number;
    key: string;
    type: string;
  },
  params: {}
): any => {
  return axios.post(
    `/form/${formId}/statistics?${qs.stringify(queries)}`,
    params
  );
};

export const FormRecordApi = (
  formId: string,
  params: Record<string, string | any>
): any => {
  return axios.get(`/form/${formId}/record`, {
    params,
    paramsSerializer: (obj) => {
      // 对于复杂对象和对象数组，先将其转换为 JSON 字符串
      const serializedParams = Object.entries(obj).reduce(
        (acc, [key, value]) => {
          // 跳过 null、undefined 和空数组值
          if (
            value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0)
          ) {
            return acc;
          }

          // 如果值是数组且包含对象，则进行 JSON 字符串化
          if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object"
          ) {
            acc[key] = JSON.stringify(value);
          }
          // 如果值是对象，则进行 JSON 字符串化
          else if (typeof value === "object") {
            acc[key] = JSON.stringify(value);
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      return qs.stringify(serializedParams, {
        encode: true,
        skipNull: true, // 跳过 null 值
      });
    },
  });
};
