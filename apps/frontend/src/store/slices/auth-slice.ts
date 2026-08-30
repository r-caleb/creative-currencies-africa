import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthMeResponse,
  AuthResponse,
  AuthUser,
  MemberProfile,
  OrganizationProfile,
  PartnerProfile,
  RefreshSessionResponse,
} from "@/lib/api";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  profile: MemberProfile | null;
  organizationProfile: OrganizationProfile | null;
  partnerProfile: PartnerProfile | null;
  status: "loading" | "anonymous" | "authenticated";
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  profile: null,
  organizationProfile: null,
  partnerProfile: null,
  status: "loading",
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.profile = null;
      state.organizationProfile = null;
      state.partnerProfile = null;
      state.status = "authenticated";
    },
    hydrateAuth(state, action: PayloadAction<Partial<AuthState>>) {
      state.accessToken = action.payload.accessToken ?? null;
      state.refreshToken = action.payload.refreshToken ?? null;
      state.user = action.payload.user ?? null;
      state.profile = action.payload.profile ?? null;
      state.organizationProfile = action.payload.organizationProfile ?? null;
      state.partnerProfile = action.payload.partnerProfile ?? null;
      state.status = action.payload.accessToken || action.payload.refreshToken ? "authenticated" : "anonymous";
    },
    setTokens(state, action: PayloadAction<RefreshSessionResponse>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;

      if (state.user) {
        state.status = "authenticated";
      }
    },
    setCurrentMember(state, action: PayloadAction<AuthMeResponse>) {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.organizationProfile = action.payload.organizationProfile;
      state.partnerProfile = action.payload.partnerProfile;
      state.status = "authenticated";
    },
    clearAuth(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.profile = null;
      state.organizationProfile = null;
      state.partnerProfile = null;
      state.status = "anonymous";
    },
  },
});

export const { clearAuth, hydrateAuth, setCredentials, setCurrentMember, setTokens } = authSlice.actions;
export const authReducer = authSlice.reducer;
