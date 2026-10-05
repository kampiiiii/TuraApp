"use client";

import { useState } from "react";
import { Beer, ClipboardList, Plus, Trash2 } from "lucide-react";
import { createTrainingBookingsAction } from "@/app/actions";
import { FeedbackForm } from "@/components/feedback-form";
import { SubmitButton } from "@/components/submit-button";
import { formatMoney, parseEuroToCents } from "@/lib/money";
import type { TrainingRow } from "@/lib/training-bookings";
import type { CatalogItem, TeamMember } from "@/lib/types";

export function TrainingForm({ members, catalog, today }: { members: TeamMember[]; catalog: CatalogItem[]; today: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<"fine" | "drink">("drink");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const players = members.filter((member) => member.active && member.role === "player");
  const items = catalog.filter((item) => item.active && item.type === type);
  function add() {
    try {
    const item = items.find((candidate) => candidate.id === itemId);
    const price = item ? (item.amount_cents / 100).toFixed(2) : amount;
    if (!selected.length || !Number.isInteger(quantity) || quantity < 1 || quantity > 50 ||
      (!item && (!description.trim() || parseEuroToCents(price) <= 0)) || rows.length + selected.length > 200) {
      setError("Bitte Spieler, Position und gültige Menge wählen. Maximal 200 Positionen."); return;
    }
    setRows([...rows, ...selected.map((memberId) => ({
      id: crypto.randomUUID(), memberId, type, catalogItemId: item?.id ?? "", quantity,
      amount: price, description: item?.name ?? description.trim()
    }))]);
    setReview(false); setError("");
    } catch { setError("Bitte einen gültigen Betrag eingeben."); }
  }
  const total = rows.reduce((sum, row) => sum + parseEuroToCents(row.amount) * row.quantity, 0);
  return <FeedbackForm action={createTrainingBookingsAction} className="training-form" onSuccess={() => { setRows([]); setReview(false); }}>
    <div className="workflow-grid">
      <label>Datum<input type="date" name="booking_date" defaultValue={today} required /></label>
      <label>Notiz<input name="notes" defaultValue="Trainingsabend" maxLength={500} /></label>
    </div>
    <input type="hidden" name="rows" value={JSON.stringify(rows)} />
    <section className="training-builder">
      <div className="workflow-modes">
        <button type="button" aria-pressed={type === "drink"} onClick={() => { setType("drink"); setItemId(""); }}><Beer size={18} /> Getränke</button>
        <button type="button" aria-pressed={type === "fine"} onClick={() => { setType("fine"); setItemId(""); }}><ClipboardList size={18} /> Strafen</button>
      </div>
      <label>Spieler<select value="" onChange={(event) => setSelected([...selected, event.target.value])}>
        <option value="">Spieler hinzufügen</option>
        {players.filter((player) => !selected.includes(player.id)).map((player) => <option key={player.id} value={player.id}>{player.display_name}</option>)}
      </select></label>
      <div className="workflow-chips">{selected.map((id) => <button type="button" key={id} onClick={() => setSelected(selected.filter((value) => value !== id))} aria-label={`Spieler entfernen: ${players.find((player) => player.id === id)?.display_name}`}>{players.find((player) => player.id === id)?.display_name} ×</button>)}</div>
      <div className="workflow-grid">
        <label>Position<select value={itemId} onChange={(event) => setItemId(event.target.value)}>
          <option value="">Freier Eintrag</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · {formatMoney(item.amount_cents)}</option>)}
        </select></label>
        <label>Menge<input type="number" min={1} max={50} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label>
        {!itemId ? <><label>Buchungsgrund<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>Einzelbetrag (€)<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label></> : null}
      </div>
      <button type="button" onClick={add}><Plus size={18} /> Position hinzufügen</button>
      {error ? <p role="alert">{error}</p> : null}
    </section>
    <div className="section-title-row"><h2>{review ? "Buchungen prüfen" : "Erfasste Positionen"} ({rows.length})</h2><strong>{formatMoney(total)}</strong></div>
    <div className="training-rows">{rows.map((row) => <div className="training-row" key={row.id}>
      <span><strong>{players.find((player) => player.id === row.memberId)?.display_name}</strong><small>{row.description}</small></span>
      {review ? <span>{row.quantity} × {formatMoney(parseEuroToCents(row.amount))}</span> : <label>Menge<input aria-label={`Menge für ${row.description}`} type="number" min={1} max={50} value={row.quantity} onChange={(event) => setRows(rows.map((value) => value.id === row.id ? { ...value, quantity: Number(event.target.value) } : value))} /></label>}
      <strong>{formatMoney(parseEuroToCents(row.amount) * row.quantity)}</strong>
      <button type="button" title="Position entfernen" aria-label="Position entfernen" onClick={() => { setRows(rows.filter((value) => value.id !== row.id)); setReview(false); }}><Trash2 size={18} /></button>
    </div>)}</div>
    {review ? <div className="workflow-modes"><button type="button" onClick={() => setReview(false)}>Zurück</button><SubmitButton pendingLabel="Wird gespeichert…">Alle Buchungen speichern</SubmitButton></div>
      : <button type="button" disabled={!rows.length} onClick={() => setReview(true)}>Buchungen prüfen</button>}
  </FeedbackForm>;
}
