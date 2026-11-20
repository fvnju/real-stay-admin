import { configureStore } from "@reduxjs/toolkit";
import { realstayApi } from "./storeConfigQuery";
import layoutSlice from "./modules/layout/layout-slice";
import authSlice from "./modules/auth/slices/auth-slice";

const  store = configureStore({
  reducer: {
    layout: layoutSlice.reducer,
    auth: authSlice.reducer,
    [realstayApi.reducerPath]: realstayApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      realstayApi.middleware
    ),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;