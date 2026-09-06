import { ACCESS_TOKEN_KEY, API_BASE_URL } from "@/constants/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function buildApiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 30000);
  try {
    const response = await fetch(buildApiUrl(path), { ...options, headers, signal: controller.signal });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(data?.message || `Request failed (${response.status}). Please try again.`, response.status);
    }
    if (data === null) throw new ApiError("The server returned an invalid response. Please try again.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError || options.signal?.aborted) throw error;
    if (controller.signal.aborted) throw new ApiError("The request timed out. Please try again.", 408);
    throw new ApiError("Unable to reach the server. Check your connection and try again.", 0);
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
