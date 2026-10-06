"use client";

import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(max-width: 720px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function ResponsiveDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia("(max-width: 720px)").matches, () => false);
  const [expanded, setExpanded] = useState(false);
  return <details className="responsive-disclosure" open={!mobile || expanded}>
    <summary onClick={(event) => { event.preventDefault(); if (mobile) setExpanded(!expanded); }}>
      <strong>{title}</strong><ChevronDown size={18} />
    </summary>
    <div className="disclosure-content">{children}</div>
  </details>;
}
