"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function signIn() {
    setPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function signUp() {
    setPending(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account angelegt. Je nach Supabase-Einstellung bitte E-Mail bestaetigen.");
      }
    } finally {
      setPending(false);
    }
  }

  if (!configured) {
    return (
      <section className="login-card">
        <h2>Supabase noch nicht verbunden</h2>
        <p>Trage `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` ein. Bis dahin zeigt die App Demo-Daten.</p>
      </section>
    );
  }

  return (
    <section className="login-card">
      <h2>Anmelden</h2>
      <label>
        E-Mail
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
      </label>
      <label>
        Passwort
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {message ? <p className="form-message">{message}</p> : null}
      <div className="button-row">
        <button className="primary-button" type="button" onClick={signIn} disabled={pending || !email || !password}>
          <LogIn size={16} />
          Anmelden
        </button>
        <button className="ghost-button" type="button" onClick={signUp} disabled={pending || !email || !password}>
          <UserPlus size={16} />
          Registrieren
        </button>
      </div>
    </section>
  );
}
