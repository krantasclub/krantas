"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/store";

type OrderRow = {
  id: string;
  product_name: string;
  price_cents: number;
  currency: string;
  size: string | null;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_method: string | null;
  shipping_address: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "confirmed", "fulfilled", "cancelled"] as const;

const STATUS_COLOR: Record<string, string> = {
  new: "#ff8a1e",
  confirmed: "#2c7a7d",
  fulfilled: "#4a7a3a",
  cancelled: "#e5837f",
};

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

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        if (data) setOrders(data as OrderRow[]);
        setFetching(false);
      });
  }, []);

  async function updateStatus(id: string, status: string) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error: err } = await supabase.from("orders").update({ status }).eq("id", id);
    if (err) setError(err.message);
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order permanently?")) return;
    await supabase.from("orders").delete().eq("id", id);
    setOrders((os) => os.filter((o) => o.id !== id));
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center font-mono text-[#9aa19d] text-sm">
        Loading...
      </div>
    );
  }

  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-[#0a0c0d] px-6 py-14 font-mono">
      <div className="max-w-[880px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/admin" className="text-[11px] tracking-[0.22em] uppercase text-[#ff8a1e]">← Back</Link>
          <span className="text-[rgba(236,231,221,0.3)]">/</span>
          <span className="font-display text-2xl tracking-[0.08em] uppercase text-[#ece7dd]">Orders</span>
        </div>

        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        <p className="text-xs text-[#9aa19d] mb-6 leading-relaxed">
          Orders placed through the <Link href="/store" className="text-[#ff8a1e]">Store</Link> page land here
          automatically, and both you and the buyer get an email the moment one comes in. Update the status as
          you take payment and ship each order.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 border ${
                filter === s
                  ? "border-[#ff8a1e] text-[#ff8a1e]"
                  : "border-[rgba(236,231,221,0.3)] text-[#9aa19d] hover:text-[#ece7dd]"
              }`}
            >
              {s} {s !== "all" && `(${orders.filter((o) => o.status === s).length})`}
            </button>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="text-xs text-[#9aa19d]">No orders here yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {shown.map((o) => (
            <div key={o.id} className="bg-[#12181a] border border-[rgba(236,231,221,0.14)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-sm text-[#ece7dd] font-medium">
                    {o.product_name}
                    {o.size && <span className="text-[#9aa19d]"> · {o.size}</span>}
                    {o.quantity > 1 && <span className="text-[#9aa19d]"> · ×{o.quantity}</span>}
                  </div>
                  <div className="text-[11px] text-[#9aa19d] mt-0.5">
                    {formatPrice(o.price_cents, o.currency)} · {new Date(o.created_at).toLocaleString()}
                  </div>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  style={{ color: STATUS_COLOR[o.status] ?? "#ece7dd" }}
                  className="bg-[#0a0c0d] border border-[rgba(236,231,221,0.3)] text-[10px] tracking-[0.16em] uppercase px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="text-[#ece7dd] bg-[#0a0c0d]">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#ece7dd] mb-3">
                <div><span className="text-[#9aa19d]">Buyer: </span>{o.customer_name}</div>
                <div>
                  <span className="text-[#9aa19d]">Email: </span>
                  <a href={`mailto:${o.customer_email}`} className="text-[#ff8a1e]">{o.customer_email}</a>
                </div>
                {o.customer_phone && <div><span className="text-[#9aa19d]">Phone: </span>{o.customer_phone}</div>}
                {o.delivery_method && (
                  <div>
                    <span className="text-[#9aa19d]">Delivery: </span>
                    {{ pickup: "Pickup at a show", address: "Delivery address", locker: "DPD parcel locker" }[o.delivery_method] ?? o.delivery_method}
                  </div>
                )}
                {o.shipping_address && <div><span className="text-[#9aa19d]">Ship to: </span>{o.shipping_address}</div>}
              </div>

              {o.notes && (
                <p className="text-xs text-[#9aa19d] leading-relaxed mb-3 pt-2 border-t border-[rgba(236,231,221,0.1)]">
                  &ldquo;{o.notes}&rdquo;
                </p>
              )}

              <div className="flex justify-end pt-2 border-t border-[rgba(236,231,221,0.1)]">
                <button
                  onClick={() => deleteOrder(o.id)}
                  className="text-[10px] tracking-[0.16em] uppercase text-[#9aa19d] hover:text-[#e5837f]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
