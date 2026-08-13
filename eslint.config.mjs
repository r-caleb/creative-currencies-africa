import nextVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextVitals,
  {
    ignores: [
      "apps/backend/dist/**",
      "apps/frontend/.next/**",
      "node_modules/**"
    ]
  }
];
