import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";

export interface ErrorResponse<T = unknown> {
  status: number;
  message: string;
  code: number;
  data?: T;
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // const token = getToken();
    // if (token) {
    //   config.headers.set("Content-Type", "application/json");
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  (response: AxiosResponse): any => {
    // 适配mock返回的内容
    const { data } = response;
    if (data?.status > 299 || data?.code > 299) {
      return Promise.reject(data);
    }

    return response;
  },
  (error) => {
    if ([401].includes(error?.response.status)) {
      return Promise.reject(new Error(error.response.data.message || "Error"));
    }

    return Promise.reject(error);
  }
);
