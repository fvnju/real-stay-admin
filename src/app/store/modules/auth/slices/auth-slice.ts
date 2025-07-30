
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Auth } from "../interfaces/auth.types";

const initialState: Auth | null = {
  token: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateAuth(state, action: PayloadAction<Auth | null>) {
      state.user = action?.payload?.user || null;
      state.token = action?.payload?.token || null;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      state.isLoggedIn = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
      }
    },
  },
});

export const { updateAuth, clearCredentials } = authSlice.actions;
export default authSlice;
