import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, AuthUser } from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  status: "anonymous" | "authenticated";
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  status: "anonymous",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.status = "authenticated";
    },
    hydrateAuth(state, action: PayloadAction<Partial<AuthState>>) {
      state.accessToken = action.payload.accessToken ?? null;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user ?? null;
      state.status = action.payload.user && action.payload.accessToken ? "authenticated" : "anonymous";
    },
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.status = "anonymous";
    },
  },
});

export const { clearAuth, hydrateAuth, setCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
