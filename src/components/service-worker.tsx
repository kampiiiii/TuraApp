"use client";

import { useEffect } from "react";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let disposed = false;
    let reloading = false;
    let registration: ServiceWorkerRegistration | null = null;
    let updateInterval: number | null = null;

    const checkForUpdate = () => {
      if (document.visibilityState === "visible") {
        void registration?.update().catch(() => undefined);
      }
    };
    const reloadForUpdate = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", reloadForUpdate);
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", checkForUpdate);

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((nextRegistration) => {
        if (disposed) return;
        registration = nextRegistration;
        void registration.update().catch(() => undefined);
        updateInterval = window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener("controllerchange", reloadForUpdate);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", checkForUpdate);
      if (updateInterval !== null) window.clearInterval(updateInterval);
    };
  }, []);

  return null;
}

