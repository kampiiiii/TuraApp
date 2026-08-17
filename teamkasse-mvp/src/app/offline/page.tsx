import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <section className="empty-state">
      <WifiOff size={30} />
      <h1>Gerade offline</h1>
      <p>Die App ist installiert, aber fuer aktuelle Buchungen braucht sie wieder Verbindung.</p>
      <Link className="primary-button" href="/dashboard">
        Dashboard
      </Link>
    </section>
  );
}
