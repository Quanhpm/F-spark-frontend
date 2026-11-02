import { apiGet, apiPost, apiRequest } from "@/shared/lib";
import type { ApiResponse } from "@/shared/types";

export type WebPushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function supportsWebPush() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandaloneWebApp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export async function getWebPushConfig() {
  return apiGet<ApiResponse<WebPushConfig>>("/api/push/config");
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? navigator.serviceWorker.register("/push-sw.js", { scope: "/" });
}

function hasApplicationServerKey(subscription: PushSubscription, expectedKey: Uint8Array) {
  const currentKey = subscription.options.applicationServerKey;
  if (!currentKey) return false;
  const currentBytes = new Uint8Array(currentKey);
  return currentBytes.length === expectedKey.length
    && currentBytes.every((value, index) => value === expectedKey[index]);
}

export async function syncWebPushSubscription(publicKey: string) {
  const registration = await getRegistration();
  const expectedKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && !hasApplicationServerKey(subscription, expectedKey)) {
    await apiRequest<ApiResponse<null>>("/api/push/subscriptions", {
      body: { endpoint: subscription.endpoint },
      method: "DELETE",
    }).catch(() => undefined);
    const removed = await subscription.unsubscribe();
    if (!removed) {
      throw new Error("The old push subscription could not be replaced.");
    }
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({
    applicationServerKey: expectedKey,
    userVisibleOnly: true,
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("The browser returned an incomplete push subscription.");
  }
  await apiPost<ApiResponse<null>>("/api/push/subscriptions", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
  return subscription;
}

export async function unsubscribeCurrentWebPush() {
  if (!supportsWebPush()) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await apiRequest<ApiResponse<null>>("/api/push/subscriptions", {
      body: { endpoint: subscription.endpoint },
      method: "DELETE",
    });
  } finally {
    await subscription.unsubscribe().catch(() => false);
  }
}
