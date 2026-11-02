"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BellRing, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/modules/auth";
import { Button } from "@/shared/components/ui";
import {
  getWebPushConfig,
  isIosDevice,
  isStandaloneWebApp,
  supportsWebPush,
  syncWebPushSubscription,
} from "./web-push";

type PushStatus = "denied" | "disabled" | "enabled" | "install-required" | "loading" | "unsupported";
type WebPushContextValue = { enable: () => Promise<void>; status: PushStatus };

const WebPushContext = createContext<WebPushContextValue>({
  enable: async () => undefined,
  status: "loading",
});

export function WebPushProvider({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.session?.user.role);
  const eligible = role === "STUDENT" || role === "MENTOR";
  const [status, setStatus] = useState<PushStatus>("loading");

  const sync = useCallback(async (requestPermission: boolean) => {
    if (!eligible || !supportsWebPush()) {
      setStatus("unsupported");
      return;
    }
    if (isIosDevice() && !isStandaloneWebApp()) {
      setStatus("install-required");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (requestPermission && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }
    }
    if (Notification.permission !== "granted") {
      setStatus("disabled");
      return;
    }
    setStatus("loading");
    const response = await getWebPushConfig();
    if (!response.data.enabled || !response.data.publicKey) {
      setStatus("unsupported");
      return;
    }
    await syncWebPushSubscription(response.data.publicKey);
    setStatus("enabled");
  }, [eligible]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void sync(false).catch(() => setStatus("disabled"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sync]);

  const enable = useCallback(async () => {
    if (status === "install-required") {
      toast.info("Trên iPhone/iPad, hãy thêm F-Spark vào Màn hình chính rồi mở lại để bật thông báo.");
      return;
    }
    if (status === "denied") {
      toast.error("Thông báo đang bị chặn. Hãy bật lại quyền trong cài đặt trình duyệt.");
      return;
    }
    try {
      await sync(true);
      toast.success("Đã bật thông báo tin nhắn.");
    } catch (error) {
      setStatus("disabled");
      toast.error(error instanceof Error ? error.message : "Không thể bật thông báo.");
    }
  }, [status, sync]);

  const value = useMemo(() => ({ enable, status }), [enable, status]);
  return <WebPushContext.Provider value={value}>{children}</WebPushContext.Provider>;
}

export function PushNotificationButton() {
  const { enable, status } = useContext(WebPushContext);
  if (status === "unsupported" || status === "enabled") return null;
  const label = status === "install-required" ? "Cài để nhận thông báo" : "Bật thông báo";
  return (
    <Button
      aria-label={label}
      disabled={status === "loading"}
      icon={status === "loading" ? <LoaderCircle className="animate-spin" size={16} /> : <BellRing size={16} />}
      onClick={() => void enable()}
      size="sm"
      variant="secondary"
    >
      <span className="max-[520px]:sr-only">{label}</span>
    </Button>
  );
}
