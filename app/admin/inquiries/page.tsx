"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  request_type: string;
  name: string;
  email: string;
  phone: string | null;
  event_date: string | null;
  guest_count: number | null;
  message: string;
  status: string;
  created_at: string;
};

type LostFoundRow = {
  id: string;
  item_description: string;
  date_lost: string | null;
  location: string | null;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
};

const REQUEST_TYPE_LABEL: Record<string, string> = {
  dj_booking: "DJ / artist booking",
  private_event: "Private event",
  other: "Other",
};

const TABS = [
  { id: "contact", label: "Contact", table: "contact_messages", statuses: ["new", "read", "replied"] },
  { id: "booking", label: "Book us", table: "booking_requests", statuses: ["new", "contacted", "confirmed", "declined"] },
  { id: "lost_found", label: "Lost & found", table: "lost_found_reports", statuses: ["new", "matched", "returned", "closed"] },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ErrorBox({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="bg-[#2a1210] border border-[#7a1f2b]/60 px-4 py-3.5 mb-5 flex items-start justify-between gap-3">
      <div className="text-xs text-[#e5837f] leading-relaxed font-mono">
        <strong>Error:</strong> {message}
      </div>
      <button onClick={onDismiss} className="bg-transparent border-0 cursor-pointer text-[#e5837f] text-base leading-none shrink-0">×</button>
    </div>
  );
}

const card = "bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5";

export default function InquiriesAdmin() {
  const [tab, setTab] = useState<TabId>("contact");
  const [contact, setContact] = useState<ContactRow[]>([]);
  const [booking, setBooking] = useState<BookingRow[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("lost_found_reports").select("*").order("created_at", { ascending: false }),
    ]).then(([c, b, l]) => {
      if (c.error) setError(c.error.message);
      else if (c.data) setContact(c.data as ContactRow[]);
      if (b.error) setError((prev) => prev ?? b.error!.message);
      else if (b.data) setBooking(b.data as BookingRow[]);
      if (l.error) setError((prev) => prev ?? l.error!.message);
      else if (l.data) setLostFound(l.data as LostFoundRow[]);
      setFetching(false);
    });
  }, []);

  function switchTab(id: TabId) {
    setTab(id);
    setFilter("all");
  }

  async function updateStatus(table: string, id: string, status: string) {
    if (table === "contact_messages") setContact((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    if (table === "booking_requests") setBooking((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    if (table === "lost_found_reports") setLostFound((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error: err } = await supabase.from(table).update({ status }).eq("id", id);
    if (err) setError(err.message);
  }

  async function remove(table: string, id: string) {
    if (!confirm("Delete this permanently?")) return;
    await supabase.from(table).delete().eq("id", id);
    if (table === "contact_messages") setContact((rs) => rs.filter((r) => r.id !== id));
    if (table === "booking_requests") setBooking((rs) => rs.filter((r) => r.id !== id));
    if (table === "lost_found_reports") setLostFound((rs) => rs.filter((r) => r.id !== id));
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center font-mono text-[#9aa19d] text-sm">
        Loading...
      </div>
    );
  }

  const activeTab = TABS.find((t) => t.id === tab)!;
  const counts = { contact: contact.length, booking: booking.length, lost_found: lostFound.length };

  return (
    <div className="min-h-screen bg-[#0a0c0d] px-6 py-14 font-mono">
      <div className="max-w-[880px] mx-auto">
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Control panel</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Inquiries</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          Submissions from the <Link href="/contact" className="text-[#ff8a1e]">Contact</Link>,{" "}
          <Link href="/book-us" className="text-[#ff8a1e]">Book us</Link>, and{" "}
          <Link href="/lost-and-found" className="text-[#ff8a1e]">Lost &amp; found</Link> pages land here — you and
          the sender both get an email the moment one comes in.
        </p>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-[rgba(236,231,221,0.14)] pb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border ${
                tab === t.id
                  ? "border-[#ff8a1e] text-[#ff8a1e]"
                  : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
              }`}
            >
              {t.label} ({counts[t.id]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...activeTab.statuses].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border ${
                filter === s
                  ? "border-[#ff8a1e] text-[#ff8a1e]"
                  : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {tab === "contact" && (
          <ContactList
            rows={filter === "all" ? contact : contact.filter((r) => r.status === filter)}
            onStatus={(id, s) => updateStatus("contact_messages", id, s)}
            onDelete={(id) => remove("contact_messages", id)}
          />
        )}
        {tab === "booking" && (
          <BookingList
            rows={filter === "all" ? booking : booking.filter((r) => r.status === filter)}
            onStatus={(id, s) => updateStatus("booking_requests", id, s)}
            onDelete={(id) => remove("booking_requests", id)}
          />
        )}
        {tab === "lost_found" && (
          <LostFoundList
            rows={filter === "all" ? lostFound : lostFound.filter((r) => r.status === filter)}
            onStatus={(id, s) => updateStatus("lost_found_reports", id, s)}
            onDelete={(id) => remove("lost_found_reports", id)}
          />
        )}
      </div>
    </div>
  );
}

function StatusSelect({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#0a0c0d] border border-[rgba(236,231,221,0.3)] text-[10px] tracking-[0.16em] uppercase px-2.5 py-1.5 outline-none cursor-pointer text-[#ece7dd]"
    >
      {options.map((s) => (
        <option key={s} value={s} className="text-[#ece7dd] bg-[#0a0c0d]">{s}</option>
      ))}
    </select>
  );
}

function EmptyState() {
  return <p className="text-xs text-[#9aa19d]">Nothing here yet.</p>;
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]">
      Delete
    </button>
  );
}

function ContactList({ rows, onStatus, onDelete }: { rows: ContactRow[]; onStatus: (id: string, s: string) => void; onDelete: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm text-[#ece7dd] font-medium">{r.subject || "No subject"}</div>
              <div className="text-[11px] text-[#9aa19d] mt-0.5">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <StatusSelect value={r.status} options={["new", "read", "replied"]} onChange={(s) => onStatus(r.id, s)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#ece7dd] mb-3">
            <div><span className="text-[#9aa19d]">From: </span>{r.name}</div>
            <div><span className="text-[#9aa19d]">Email: </span><a href={`mailto:${r.email}`} className="text-[#ff8a1e]">{r.email}</a></div>
            {r.phone && <div><span className="text-[#9aa19d]">Phone: </span>{r.phone}</div>}
          </div>
          <p className="text-xs text-[#ece7dd]/90 leading-relaxed mb-3 pt-2 border-t border-[rgba(236,231,221,0.1)] whitespace-pre-wrap">{r.message}</p>
          <div className="flex justify-end pt-2 border-t border-[rgba(236,231,221,0.1)]">
            <DeleteButton onClick={() => onDelete(r.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingList({ rows, onStatus, onDelete }: { rows: BookingRow[]; onStatus: (id: string, s: string) => void; onDelete: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm text-[#ece7dd] font-medium">{REQUEST_TYPE_LABEL[r.request_type] ?? r.request_type}</div>
              <div className="text-[11px] text-[#9aa19d] mt-0.5">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <StatusSelect value={r.status} options={["new", "contacted", "confirmed", "declined"]} onChange={(s) => onStatus(r.id, s)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#ece7dd] mb-3">
            <div><span className="text-[#9aa19d]">From: </span>{r.name}</div>
            <div><span className="text-[#9aa19d]">Email: </span><a href={`mailto:${r.email}`} className="text-[#ff8a1e]">{r.email}</a></div>
            {r.phone && <div><span className="text-[#9aa19d]">Phone: </span>{r.phone}</div>}
            {r.event_date && <div><span className="text-[#9aa19d]">Date: </span>{r.event_date}</div>}
            {r.guest_count != null && <div><span className="text-[#9aa19d]">Guests: </span>{r.guest_count}</div>}
          </div>
          <p className="text-xs text-[#ece7dd]/90 leading-relaxed mb-3 pt-2 border-t border-[rgba(236,231,221,0.1)] whitespace-pre-wrap">{r.message}</p>
          <div className="flex justify-end pt-2 border-t border-[rgba(236,231,221,0.1)]">
            <DeleteButton onClick={() => onDelete(r.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LostFoundList({ rows, onStatus, onDelete }: { rows: LostFoundRow[]; onStatus: (id: string, s: string) => void; onDelete: (id: string) => void }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm text-[#ece7dd] font-medium">{r.item_description}</div>
              <div className="text-[11px] text-[#9aa19d] mt-0.5">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <StatusSelect value={r.status} options={["new", "matched", "returned", "closed"]} onChange={(s) => onStatus(r.id, s)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#ece7dd] mb-3">
            <div><span className="text-[#9aa19d]">From: </span>{r.name}</div>
            <div><span className="text-[#9aa19d]">Email: </span><a href={`mailto:${r.email}`} className="text-[#ff8a1e]">{r.email}</a></div>
            {r.phone && <div><span className="text-[#9aa19d]">Phone: </span>{r.phone}</div>}
            {r.date_lost && <div><span className="text-[#9aa19d]">Date lost: </span>{r.date_lost}</div>}
            {r.location && <div><span className="text-[#9aa19d]">Location: </span>{r.location}</div>}
          </div>
          <div className="flex justify-end pt-2 border-t border-[rgba(236,231,221,0.1)]">
            <DeleteButton onClick={() => onDelete(r.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
