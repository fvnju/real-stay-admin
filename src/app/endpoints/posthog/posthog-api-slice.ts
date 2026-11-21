import { createApi } from "@reduxjs/toolkit/query/react";
import type { AxiosStatic } from "axios";

import type { AnalyticsMetric, AnalyticsRange, MetricRow } from "@/lib/analytics-metrics";
import type { FlagForm, PosthogFlag } from "@/lib/feature-flag-rules";
import axiosBaseQuery from "@/app/store/axiosBaseQuery";
import { AxiosInstance } from "@/app/store/httpConfig";

export type FlagListArgs = { search?: string; active?: "true" | "false" };
export type FlagWrite = { form: FlagForm; updatedAt?: string; version?: number };
export type FlagWriteResult = { data: PosthogFlag; auditFailed: boolean; concurrentChange?: boolean };
export type FlagList = { flags: PosthogFlag[]; truncated: boolean };
export type Cohort = { id: number; name: string };

/**
 * The PostHog routes of the panel (`/api/posthog/*`). The server routes
 * have the PostHog key; the page never calls PostHog.
 */
export const posthogApi = createApi({
  reducerPath: "posthog",
  tagTypes: ["Flag", "Analytics"],
  baseQuery: axiosBaseQuery({ baseURL: "/api/posthog" }, AxiosInstance as AxiosStatic),
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: 10,
  endpoints: (builder) => ({
    getFlags: builder.query<FlagList, FlagListArgs>({
      query: (params) => ({ url: "/flags", method: "GET", params }),
      transformResponse: (res: { data: PosthogFlag[]; truncated?: boolean }) => ({
        flags: res.data,
        truncated: res.truncated === true,
      }),
      providesTags: ["Flag"],
    }),
    getFlag: builder.query<PosthogFlag, number>({
      query: (id) => ({ url: `/flags/${id}`, method: "GET" }),
      transformResponse: (res: { data: PosthogFlag }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Flag", id }],
    }),
    createFlag: builder.mutation<FlagWriteResult, FlagWrite>({
      query: (data) => ({ url: "/flags", method: "POST", data }),
      invalidatesTags: ["Flag"],
    }),
    updateFlag: builder.mutation<FlagWriteResult, FlagWrite & { id: number }>({
      query: ({ id, ...data }) => ({ url: `/flags/${id}`, method: "PATCH", data }),
      invalidatesTags: ["Flag"],
    }),
    deleteFlag: builder.mutation<{ data: { id: number }; auditFailed: boolean }, number>({
      query: (id) => ({ url: `/flags/${id}`, method: "DELETE" }),
      invalidatesTags: ["Flag"],
    }),
    getMetric: builder.query<MetricRow[], { metric: AnalyticsMetric; days: AnalyticsRange }>({
      query: ({ metric, days }) => ({ url: `/analytics/${metric}`, method: "GET", params: { days } }),
      transformResponse: (res: { data: MetricRow[] }) => res.data,
      providesTags: ["Analytics"],
    }),
    getCohorts: builder.query<Cohort[], void>({
      query: () => ({ url: "/cohorts", method: "GET" }),
      transformResponse: (res: { data: Cohort[] }) => res.data,
    }),
  }),
});
