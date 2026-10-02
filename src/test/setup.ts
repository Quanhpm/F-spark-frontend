import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

process.env.NEXT_PUBLIC_APP_ENV = "test";
process.env.NEXT_PUBLIC_API_BASE_URL ??= "http://localhost:8080";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
