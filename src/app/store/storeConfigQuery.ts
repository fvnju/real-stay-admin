import { createApi } from '@reduxjs/toolkit/query/react';
import { AxiosStatic } from 'axios';
import { AxiosInstance } from './httpConfig';
import axiosBaseQuery from './axiosBaseQuery';



export const realstayApi = createApi({
    reducerPath: 'real_stay',
    tagTypes: ["User"],
    baseQuery: axiosBaseQuery({}, AxiosInstance as AxiosStatic),
    endpoints: () => ({}),
});


