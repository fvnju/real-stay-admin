import { createApi } from '@reduxjs/toolkit/query/react';
import { AxiosStatic } from 'axios';
import { AxiosInstance } from './httpConfig';
import axiosBaseQuery from './axiosBaseQuery';



export const realstayApi = createApi({
    reducerPath: 'real_stay',
    tagTypes: ["User", "MyPermissions", "Role", "Report", "AccessRequest", "Verification"],
    baseQuery: axiosBaseQuery({}, AxiosInstance as AxiosStatic),
    endpoints: () => ({}),
    // Keep the data of a page for 5 minutes after it closes, so that it
    // opens again with its data. A page loads data older than 10 seconds
    // again in the background (data from a prefetch is younger).
    keepUnusedDataFor: 300,
    refetchOnMountOrArgChange: 10,
});


