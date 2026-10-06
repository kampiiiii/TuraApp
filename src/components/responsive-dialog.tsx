"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ResponsiveDialog({ children, label, onClose, className = "" }: {
  children: ReactNode; label: string; onClose: () => void; className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; focus?.focus(); };
  }, []);
  return <dialog ref={dialog} className={`responsive-dialog ${className}`} aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) onClose();
    }}>
    {children}
  </dialog>;
}
