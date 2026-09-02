import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { ServiceWorker } from "@/components/service-worker";
import { getShellData } from "@/lib/team-queries";
import "./globals.css";
import "./dashboard-controls.css";

export const metadata: Metadata = {
  title: "TURA App",
  description: "MVP fuer Strafen, Getraenke und Mannschaftskasse",
  manifest: "/manifest.webmanifest",
  icons: [{ rel: "icon", url: "/icons/tura-icon-v2.svg" }]
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1
};

const themeScript = `try{const value=localStorage.getItem("tura-theme");if(value==="light"||value==="dark"){document.documentElement.dataset.theme=value}}catch{}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const shellData = await getShellData();

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ServiceWorker />
        <AppShell context={shellData}>{children}</AppShell>
      </body>
    </html>
  );
}
