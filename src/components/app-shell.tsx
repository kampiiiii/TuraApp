import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, KeyRound, LayoutDashboard, LogIn, LogOut, ReceiptText, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AppData } from "@/lib/types";

type ShellContext = Pick<AppData, "isDemo" | "authState" | "team" | "currentMember">;

export function AppShell({ children, context }: { children: ReactNode; context: ShellContext }) {
  const isAdmin = context.currentMember?.role === "admin";
  const showAppLinks = context.authState === "member";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand" aria-label="TURA App Dashboard">
          <span className="brand-mark">TA</span>
          <span>
            <strong>TURA App</strong>
            <small>{context.isDemo ? "Setup fehlt" : context.currentMember?.display_name ?? "PWA"}</small>
          </span>
        </Link>

        <nav className="nav-list" aria-label="Hauptnavigation">
          {showAppLinks ? (
            <>
              <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              {isAdmin ? <NavLink href="/admin" icon={<ShieldCheck size={18} />} label="Admin" /> : null}
              <NavLink href="/buchungen" icon={<ReceiptText size={18} />} label="Buchungen" />
              <NavLink href="/katalog" icon={<ClipboardList size={18} />} label="Katalog" />
              {!isAdmin ? <NavLink href="/profil" icon={<KeyRound size={18} />} label="Profil" /> : null}
            </>
          ) : (
            <NavLink href="/login" icon={<LogIn size={18} />} label="Login" />
          )}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          {context.isDemo ? <span className="demo-chip">Login-Setup fehlt</span> : null}
          {!context.isDemo && context.authState === "member" ? (
            <form action={logoutAction}>
              <button className="ghost-button full-width" type="submit" aria-label="Abmelden" title="Abmelden">
                <LogOut size={16} />
                <span className="logout-label">Abmelden</span>
              </button>
            </form>
          ) : null}
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="nav-link">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
