import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("route protection proxy", () => {
  it("redirects a protected route to login when the refresh cookie is absent", () => {
    const response = proxy(
      new NextRequest("https://startup.f-spark.vn/admin/users?tab=active"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://startup.f-spark.vn/login?next=%2Fadmin%2Fusers%3Ftab%3Dactive",
    );
  });

  it.each(["__Host-fspark-refresh", "fspark-refresh"])(
    "allows the request when %s is present",
    (cookieName) => {
      const request = new NextRequest(
        "https://startup.f-spark.vn/student/dashboard",
      );
      request.cookies.set(cookieName, "opaque-refresh-token");

      const response = proxy(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );
});
