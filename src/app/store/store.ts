import { configureStore, createListenerMiddleware, isRejectedWithValue } from "@reduxjs/toolkit";
import { missingPermissionOf } from "@/lib/permissions";
import { realstayApi } from "./storeConfigQuery";
import layoutSlice from "./modules/layout/layout-slice";
import authSlice from "./modules/auth/slices/auth-slice";

/**
 * A request that the backend refuses with MISSING_PERMISSION: the role of
 * the admin changed. Load `/rbac/me` again, so the page shows the blocked
 * state.
 */
const permissionListener = createListenerMiddleware();
permissionListener.startListening({
  matcher: isRejectedWithValue,
  effect: (action, api) => {
    if (missingPermissionOf(action.payload)) {
      api.dispatch(realstayApi.util.invalidateTags(["MyPermissions"]));
    }
  },
});

const  store = configureStore({
  reducer: {
    layout: layoutSlice.reducer,
    auth: authSlice.reducer,
    [realstayApi.reducerPath]: realstayApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      realstayApi.middleware,
      permissionListener.middleware,
    ),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;