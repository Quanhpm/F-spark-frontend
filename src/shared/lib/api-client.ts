const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV;
const API_BASE_URL =
  APP_ENV === "staging" || APP_ENV === "production"
    ? ""
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "");

type PrimitiveQueryValue = string | number | boolean;

type QueryValue =
  | PrimitiveQueryValue
  | PrimitiveQueryValue[]
  | null
  | undefined;

export type QueryParams = Record<string, QueryValue>;

type ApiRequestBody = BodyInit | object | null | undefined;

type ApiParseMode = "json" | "blob" | "text" | "response";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  accessToken?: string | null;
  auth?: boolean;
  body?: ApiRequestBody;
  parseAs?: ApiParseMode;
  query?: QueryParams;
};

type ApiErrorPayload = {
  code?: number;
  message?: string;
  error?: string;
};

type AccessTokenResolver = () => string | null | undefined;

let accessTokenResolver: AccessTokenResolver | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function setApiAccessTokenResolver(
  resolver: AccessTokenResolver | null,
) {
  accessTokenResolver = resolver;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBodyInit(value: ApiRequestBody): value is BodyInit {
  return (
    typeof value === "string" ||
    (typeof FormData !== "undefined" && value instanceof FormData) ||
    (typeof Blob !== "undefined" && value instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) ||
    (typeof URLSearchParams !== "undefined" &&
      value instanceof URLSearchParams) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream)
  );
}

function buildUrl(path: string, query?: QueryParams) {
  const hasExplicitBaseUrl = Boolean(API_BASE_URL);
  const url = new URL(path, API_BASE_URL || "http://same-origin.local");

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return hasExplicitBaseUrl
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;
}

function buildRequestBody(body: ApiRequestBody) {
  if (body === undefined || body === null) return undefined;
  if (isBodyInit(body)) return body;
  return JSON.stringify(body);
}

function shouldSetJsonContentType(body: ApiRequestBody) {
  return body !== undefined && body !== null && !isBodyInit(body);
}

async function parseResponse(response: Response, parseAs: ApiParseMode) {
  if (parseAs === "response") return response;
  if (response.status === 204) return null;
  if (parseAs === "blob") return response.blob();
  if (parseAs === "text") return response.text();

  return response.json().catch(() => null);
}

function getErrorMessage(payload: unknown) {
  if (!isRecord(payload)) return null;

  const errorPayload = payload as ApiErrorPayload;
  return errorPayload.message ?? errorPayload.error ?? null;
}

export async function apiRequest<T>(
  path: string,
  {
    accessToken,
    auth = true,
    body,
    headers,
    parseAs = "json",
    query,
    ...init
  }: ApiRequestOptions = {},
): Promise<T> {
  const resolvedAccessToken =
    accessToken ?? (auth ? accessTokenResolver?.() : null);
  const requestBody = buildRequestBody(body);
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set(
      "Accept",
      parseAs === "blob" ? "*/*" : "application/json",
    );
  }

  if (shouldSetJsonContentType(body) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (resolvedAccessToken) {
    requestHeaders.set("Authorization", `Bearer ${resolvedAccessToken}`);
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    body: requestBody,
    credentials: init.credentials ?? "include",
    headers: requestHeaders,
  });

  const payload = await parseResponse(response, parseAs);

  if (!response.ok) {
    const message =
      getErrorMessage(payload) ??
      "Unable to connect to the server. Please try again.";

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

type ApiMethodOptions = Omit<ApiRequestOptions, "body" | "method">;

export function apiGet<T>(path: string, options?: ApiMethodOptions) {
  return apiRequest<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(
  path: string,
  body?: ApiRequestBody,
  options?: ApiMethodOptions,
) {
  return apiRequest<T>(path, { ...options, body, method: "POST" });
}

export function apiPatch<T>(
  path: string,
  body?: ApiRequestBody,
  options?: ApiMethodOptions,
) {
  return apiRequest<T>(path, { ...options, body, method: "PATCH" });
}

export function apiPut<T>(
  path: string,
  body?: ApiRequestBody,
  options?: ApiMethodOptions,
) {
  return apiRequest<T>(path, { ...options, body, method: "PUT" });
}

export function apiDelete<T>(path: string, options?: ApiMethodOptions) {
  return apiRequest<T>(path, { ...options, method: "DELETE" });
}

export function apiUpload<T>(
  path: string,
  formData: FormData,
  options?: ApiMethodOptions,
) {
  return apiRequest<T>(path, {
    ...options,
    body: formData,
    method: "POST",
  });
}

export function apiDownload(path: string, options?: ApiMethodOptions) {
  return apiRequest<Blob>(path, {
    ...options,
    method: "GET",
    parseAs: "blob",
  });
}
