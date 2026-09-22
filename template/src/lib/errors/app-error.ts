export type AppErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "NETWORK"
  | "UNKNOWN";

interface AppErrorOptions {
  code?: AppErrorCode;
  statusCode?: number;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;

  constructor(
    message: string,
    { code = "UNKNOWN", statusCode = 500, cause }: AppErrorOptions = {},
  ) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function classifyHttpStatus(status: number | undefined): AppErrorCode {
  switch (status) {
    case 404:
      return "NOT_FOUND";
    case 401:
    case 403:
      return "UNAUTHORIZED";
    case 422:
      return "VALIDATION";
    default:
      return status === undefined ? "NETWORK" : "UNKNOWN";
  }
}
