import { configureStore, createListenerMiddleware, isRejectedWithValue } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { missingPermissionOf } from "@/lib/permissions";
import { realstayApi } from "./storeConfigQuery";
import { posthogApi } from "@/app/endpoints/posthog/posthog-api-slice";
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
    [posthogApi.reducerPath]: posthogApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      realstayApi.middleware,
      posthogApi.middleware,
      permissionListener.middleware,
    ),
});

/**
 * Tell RTK Query when the tab is hidden or shown (`visibilitychange`, `focus`).
 * Without it, `skipPollingIfUnfocused` has no effect: the bell polled the
 * backend each minute also in a background tab. It does nothing on the server.
 */
setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;