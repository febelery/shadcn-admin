import axios from "axios";
import qs from "query-string";

export interface QiniuParam {
  name: string;
  modified: Number;
  size: Number;
  type: string;
}

export interface QiniuRes {
  uptoken: string;
}

export function qiniuUptokenApi(params: QiniuParam): any {
  return axios.get<QiniuRes>("/qiniu/uptoken", {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj);
    },
  });
}
