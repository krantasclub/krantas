import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { adminContactEmail, senderContactEmail } from "@/lib/email-templates";

// Service role client — bypasses RLS, runs only on the server. Same
// pattern as /api/store/order — the browser never writes this table
// directly with the anon key.
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
    const { name, email, phone, subject, message } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const supabase = adminClient();

    const { data: row, error: insertErr } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim(),
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ error: insertErr?.message ?? "Could not save your message." }, { status: 500 });
    }

    // Email is best-effort — the message is already saved either way.
    let emailError: string | null = null;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      const adminEmail = process.env.CONTACT_EMAIL || process.env.STORE_ORDER_EMAIL;
      if (!apiKey || !fromEmail || !adminEmail) {
        throw new Error("Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL / CONTACT_EMAIL).");
      }
      const resend = new Resend(apiKey);
      const emailData = {
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message,
        createdAt: new Date(row.created_at),
      };

      const admin = adminContactEmail(emailData);
      const sender = senderContactEmail(emailData);

      await Promise.all([
        resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          replyTo: row.email,
          subject: admin.subject,
          html: admin.html,
        }),
        resend.emails.send({
          from: fromEmail,
          to: row.email,
          replyTo: adminEmail,
          subject: sender.subject,
          html: sender.html,
        }),
      ]);
    } catch (e: unknown) {
      emailError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({ ok: true, id: row.id, emailError });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
