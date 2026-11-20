import { createSlice } from "@reduxjs/toolkit";
import { LayoutSliceType } from "./interfaces/layout-slice";

export const initialLayoutData: LayoutSliceType = {
  isDrawerOpen: true,
  isAdminUser: false,
  initiatedRepaymentCount: 0,
  pendingCreditRequestsCount: 0,
  pendingWithdrawalRequestsCount: 0,
};

const layoutSlice = createSlice({
  name: "individualOnboarding",
  initialState: initialLayoutData,
  reducers: {
    toggleDrawer(state) {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setDrawerState(state, action) {
      state.isDrawerOpen = action.payload as boolean;
    },
  },
});

export const { toggleDrawer, setDrawerState } = layoutSlice.actions;
export default layoutSlice;
