import { API_ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/services/api-client";
import type { Feature } from "@/types/api";

export function listFeatures() {
  return apiFetch<{ features: Feature[] }>(API_ENDPOINTS.features.list).then((response) => response.features);
}

export function createFeature(feature: {
  key: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
}) {
  return apiFetch<{ feature: Feature }>(API_ENDPOINTS.features.create, {
    method: "POST",
    body: JSON.stringify(feature),
  }).then((response) => response.feature);
}

export function updateFeature(featureId: string, feature: Partial<Feature>) {
  return apiFetch<{ feature: Feature }>(API_ENDPOINTS.features.update(featureId), {
    method: "PATCH",
    body: JSON.stringify(feature),
  }).then((response) => response.feature);
}
