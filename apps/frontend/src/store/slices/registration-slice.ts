import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PendingVerification = {
  email: string;
  expiresAt: string;
};

type RegistrationState = {
  accountTypeSlug: string | null;
  pendingVerification: PendingVerification | null;
};

const initialState: RegistrationState = {
  accountTypeSlug: null,
  pendingVerification: null,
};

export const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    setRegistrationAccountType(state, action: PayloadAction<string>) {
      state.accountTypeSlug = action.payload;
    },
    setPendingVerification(state, action: PayloadAction<PendingVerification>) {
      state.pendingVerification = action.payload;
    },
    hydratePendingVerification(state, action: PayloadAction<PendingVerification | null>) {
      state.pendingVerification = action.payload;
    },
    clearPendingVerification(state) {
      state.pendingVerification = null;
    },
  },
});

export const {
  clearPendingVerification,
  hydratePendingVerification,
  setPendingVerification,
  setRegistrationAccountType,
} = registrationSlice.actions;
export const registrationReducer = registrationSlice.reducer;
