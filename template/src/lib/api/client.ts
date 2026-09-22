import axios from "axios";
import { env } from "@/config/env";
import { AppError, classifyHttpStatus } from "@/lib/errors/app-error";
import { logError } from "@/lib/errors/log-error";

// ponytail: browser-only token read, so server-side calls through this client go unauthenticated.
// Add a server-safe variant (reading next/headers cookies()) when a feature needs authenticated SSR fetches.
function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth-token="))
      ?.split("=")[1] ?? null
  );
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? String(error.response.data.message)
        : error instanceof Error
          ? error.message
          : "Request failed";

    const appError = new AppError(message, {
      code: classifyHttpStatus(statusCode),
      statusCode: statusCode ?? 500,
      cause: error,
    });

    logError(appError, {
      url: axios.isAxiosError(error) ? error.config?.url : undefined,
    });

    return Promise.reject(appError);
  },
);
