"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarClock, ClipboardList, Ellipsis, KeyRound, LayoutDashboard, ReceiptText, ShieldCheck, Users, WalletCards, X } from "lucide-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";

export function MobileNavigation({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const primary = [
    { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
    { href: "/buchungen", label: "Buchungen", icon: ReceiptText },
    isAdmin ? { href: "/kasse", label: "Kasse", icon: WalletCards } : { href: "/katalog", label: "Katalog", icon: ClipboardList }
  ];
  const extra = [
    ...(isAdmin ? [
      { href: "/admin", label: "Verwaltung", icon: ShieldCheck },
      { href: "/training", label: "Trainingsabend", icon: Users },
      { href: "/beitraege", label: "Beiträge & Getränke-Flat", icon: CalendarClock },
      { href: "/katalog", label: "Katalog", icon: ClipboardList }
    ] : [{ href: "/profil", label: "Mein Profil", icon: KeyRound }]),
    { href: "/kontoauszug", label: "Kontoauszug", icon: ReceiptText }
  ];
  return <>
    <nav className="nav-list mobile-navigation" aria-label="Mobile Hauptnavigation">
      {primary.map(({ href, label, icon: Icon }) => <Link key={href} href={href}
        className={`nav-link ${path === href ? "active" : ""}`} aria-current={path === href ? "page" : undefined}>
        <Icon size={20} /><span>{label}</span>
      </Link>)}
      <button type="button" className={`nav-link ${extra.some((item) => item.href === path) ? "active" : ""}`}
        aria-expanded={more} aria-haspopup="dialog" onClick={() => setMore(true)}><Ellipsis size={20} /><span>Mehr</span></button>
    </nav>
    {more ? <ResponsiveDialog label="Weitere Bereiche" className="more-dialog" onClose={() => setMore(false)}>
      <div className="mobile-dialog-heading"><h2>Weitere Bereiche</h2><button type="button" className="icon-button" aria-label="Schließen" onClick={() => setMore(false)}><X size={20} /></button></div>
      <nav className="more-links" aria-label="Weitere Bereiche">
        {extra.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={path === href ? "page" : undefined} onClick={() => setMore(false)}><Icon size={21} /><span>{label}</span></Link>)}
      </nav>
    </ResponsiveDialog> : null}
  </>;
}
