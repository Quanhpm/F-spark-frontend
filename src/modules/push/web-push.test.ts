import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiPost, apiRequest } from "@/shared/lib";
import { syncWebPushSubscription } from "./web-push";

vi.mock("@/shared/lib", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiRequest: vi.fn(),
}));

function subscription(key: number[], endpoint: string) {
  return {
    endpoint,
    options: { applicationServerKey: Uint8Array.from(key).buffer },
    toJSON: () => ({
      endpoint,
      keys: { auth: "auth-key", p256dh: "p256dh-key" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription;
}

describe("syncWebPushSubscription", () => {
  beforeEach(() => {
    vi.mocked(apiPost).mockReset().mockResolvedValue({ code: 200, data: null, message: "OK" });
    vi.mocked(apiRequest).mockReset().mockResolvedValue({ code: 200, data: null, message: "OK" });
  });

  it("replaces a subscription created with an old VAPID public key", async () => {
    const oldSubscription = subscription([1, 2], "https://fcm.googleapis.com/old");
    const newSubscription = subscription([3, 4], "https://fcm.googleapis.com/new");
    const subscribe = vi.fn().mockResolvedValue(newSubscription);
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(oldSubscription),
        subscribe,
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistration: vi.fn().mockResolvedValue(registration) },
    });

    await syncWebPushSubscription("AwQ");

    expect(apiRequest).toHaveBeenCalledWith("/api/push/subscriptions", {
      body: { endpoint: oldSubscription.endpoint },
      method: "DELETE",
    });
    expect(oldSubscription.unsubscribe).toHaveBeenCalledOnce();
    expect(subscribe).toHaveBeenCalledWith({
      applicationServerKey: Uint8Array.from([3, 4]),
      userVisibleOnly: true,
    });
    expect(apiPost).toHaveBeenCalledWith("/api/push/subscriptions", {
      endpoint: newSubscription.endpoint,
      keys: { auth: "auth-key", p256dh: "p256dh-key" },
    });
  });
});
