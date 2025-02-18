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
