/* global self, clients */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" ? payload.title : "F-Spark";
  const body = typeof payload.body === "string" ? payload.body : "Bạn có tin nhắn mới.";
  const url = typeof payload.url === "string" ? payload.url : "/";
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;

  event.waitUntil(self.registration.showNotification(title, {
    body,
    data: { url },
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag,
    renotify: Boolean(tag),
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const rawUrl = event.notification.data && event.notification.data.url;
    const target = new URL(typeof rawUrl === "string" ? rawUrl : "/", self.location.origin);
    if (target.origin !== self.location.origin) return;

    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === target.origin);
    if (existing) {
      await existing.navigate(target.href);
      return existing.focus();
    }
    return clients.openWindow(target.href);
  })());
});
