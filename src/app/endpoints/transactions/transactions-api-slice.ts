import { realstayApi } from "@/app/store/storeConfigQuery";
import { ApiRequest, ApiResponse } from "../api";
import { Transaction, TransactionsAPIResponse } from "./transactions-types";

export const transactionApi = realstayApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getTransaction: builder.query<ApiResponse<Transaction>, ApiRequest>({
      query: ({ path }) => {
        return {
          url: `/transactions/${path?.id}`,
          method: "GET",
        };
      },
    }),
    getTransactions: builder.query<ApiResponse<TransactionsAPIResponse>, ApiRequest>({
      query: ({ params }) => {
        return {
          url: `/transactions`,
          method: "GET",
          params,
        };
      },
    }),
  }),
});
