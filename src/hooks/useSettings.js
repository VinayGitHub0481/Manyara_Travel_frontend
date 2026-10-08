

import { useQuery } from "./useQuery";
import { getSiteSettings } from "../api/content";

/* Site settings from the shared cache (same data as getSiteSettings()). */
export function useSettings() {
  const { data, loading } = useQuery(getSiteSettings);
  return { settings: data ?? null, loading };
}