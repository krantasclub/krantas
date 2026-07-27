import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { formatPrice } from "@/lib/store";
import { adminOrderEmail, customerOrderEmail } from "@/lib/email-templates";

// Service role client — bypasses RLS, runs only on the server. Orders are
// deliberately never inserted with the anon key (see supabase/schema.sql).
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createClient(url, key, { auth: { persistSession: false } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      size,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      notes,
    } = body ?? {};

    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ error: "Missing product." }, { status: 400 });
    }
    if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!customerEmail || typeof customerEmail !== "string" || !EMAIL_RE.test(customerEmail)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    const qty = Number(quantity) || 1;
    if (qty < 1 || qty > 20) {
      return NextResponse.json({ error: "Quantity must be between 1 and 20." }, { status: 400 });
    }

    const supabase = adminClient();

    // Look the product up server-side so the price/name in the order and
    // emails can't be tampered with from the client.
    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productErr || !product) {
      return NextResponse.json({ error: "That product could not be found." }, { status: 404 });
    }
    if (product.sold_out) {
      return NextResponse.json({ error: "That product is sold out." }, { status: 409 });
    }
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      if (!size || !product.sizes.includes(size)) {
        return NextResponse.json({ error: "Please choose a size." }, { status: 400 });
      }
    }

    const { data: order, error: insertErr } = await supabase
      .from("orders")
      .insert({
        product_id: product.id,
        product_name: product.name,
        price_cents: product.price_cents,
        currency: product.currency,
        size: size || null,
        quantity: qty,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone?.trim() || null,
        shipping_address: shippingAddress?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (insertErr || !order) {
      return NextResponse.json({ error: insertErr?.message ?? "Could not save the order." }, { status: 500 });
    }

    // Email is best-effort — the order is already saved either way, so a
    // Resend hiccup shouldn't make the buyer think their order failed.
    let emailError: string | null = null;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      const adminEmail = process.env.STORE_ORDER_EMAIL;
      if (!apiKey || !fromEmail || !adminEmail) {
        throw new Error("Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL / STORE_ORDER_EMAIL).");
      }
      const resend = new Resend(apiKey);
      const priceLabel = formatPrice(order.price_cents, order.currency);
      const emailData = {
        productName: order.product_name,
        priceLabel,
        size: order.size,
        quantity: order.quantity,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        shippingAddress: order.shipping_address,
        notes: order.notes,
        createdAt: new Date(order.created_at),
      };

      const admin = adminOrderEmail(emailData);
      const customer = customerOrderEmail(emailData);

      await Promise.all([
        resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          replyTo: order.customer_email,
          subject: admin.subject,
          html: admin.html,
        }),
        resend.emails.send({
          from: fromEmail,
          to: order.customer_email,
          replyTo: adminEmail,
          subject: customer.subject,
          html: customer.html,
        }),
      ]);
    } catch (e: unknown) {
      emailError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({ ok: true, orderId: order.id, emailError });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
