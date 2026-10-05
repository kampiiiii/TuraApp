"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return <button type="button" className="no-print" onClick={() => window.print()}><Printer size={18} /> Drucken / PDF</button>;
}
