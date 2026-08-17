import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ServiceWorker } from "@/components/service-worker";
import { getShellData } from "@/lib/team-queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teamkasse",
  description: "MVP fuer Strafen, Getraenke und Mannschaftskasse",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icons/icon.svg" }]
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const shellData = await getShellData();

  return (
    <html lang="de">
      <body>
        <ServiceWorker />
        <AppShell context={shellData}>{children}</AppShell>
      </body>
    </html>
  );
}
