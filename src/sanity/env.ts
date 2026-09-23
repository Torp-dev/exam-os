export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "YOUR_PROJECT_ID";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-09-01";

export const configured =
  !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "YOUR_PROJECT_ID";
