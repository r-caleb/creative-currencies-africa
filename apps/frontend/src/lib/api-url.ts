const LOCAL_API_URL = "http://localhost:4000/api";
const PRODUCTION_API_URL = "https://creative-currencies-africa.onrender.com/api";

function normalizeApiUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_URL = normalizeApiUrl(
  process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production" ? PRODUCTION_API_URL : LOCAL_API_URL),
);
