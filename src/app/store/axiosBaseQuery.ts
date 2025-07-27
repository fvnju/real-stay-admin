import { AxiosInstance, AxiosRequestConfig } from "axios";

export default function axiosBaseQuery(
  baseConfig: AxiosRequestConfig,
  http: AxiosInstance
) {
  async function request(config: AxiosRequestConfig) {
    const url = config.url
      ? (baseConfig.url || "") + config.url
      : baseConfig.url;
    try {
      const response = await http.request({ ...baseConfig, ...config, url });
      return {
        data: response.data || null,
        meta: { request: response.request, response },
        // status: response?.status
      };
    } catch (error: any) {
      return {
        error: error.response
          ? {
              defaultUserMessage: "",
              status: error?.response?.status,
              data: error?.response?.data,
            }
          : {
              defaultUserMessage: "Something went wrong",
              data: { defaultUserMessage: "Something went wrong", error },
            },
      };
    }
  }
  return request;
}
