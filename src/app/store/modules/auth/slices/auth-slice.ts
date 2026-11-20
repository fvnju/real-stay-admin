import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Auth } from "../interfaces/auth.types";

const initialState: Auth = {
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateAuth(state, action: PayloadAction<Auth | null>) {
      state.user = action?.payload?.user || null;
    },
    clearCredentials(state) {
      state.user = null;
    },
  },
});

export const { updateAuth, clearCredentials } = authSlice.actions;
export default authSlice;
