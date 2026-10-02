import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiGet,
  apiPost,
  setApiAccessTokenResolver,
} from "./api-client";

const fetchMock = vi.fn<typeof fetch>();

describe("api client", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    setApiAccessTokenResolver(null);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("adds the resolved bearer token and JSON headers", async () => {
    setApiAccessTokenResolver(() => "access-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    const response = await apiPost<{ data: { ok: boolean } }>(
      "/api/example",
      { name: "F-Spark" },
    );

    expect(response.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);

    expect(url).toBe("http://localhost:8080/api/example");
    expect(init?.method).toBe("POST");
    expect(init?.credentials).toBe("include");
    expect(init?.body).toBe(JSON.stringify({ name: "F-Spark" }));
    expect(headers.get("Authorization")).toBe("Bearer access-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not attach authorization when auth is disabled", async () => {
    setApiAccessTokenResolver(() => "access-token");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );

    await apiGet("/api/public", { auth: false });

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("throws ApiError with the API message", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      }),
    );

    await expect(apiPost("/api/auth/login", {}, { auth: false })).rejects.toEqual(
      expect.objectContaining({
        message: "Invalid credentials",
        name: "ApiError",
        status: 401,
      }),
    );
  });
});
