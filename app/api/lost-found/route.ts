import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { adminLostFoundEmail, senderLostFoundEmail } from "@/lib/email-templates";

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
    const { itemDescription, dateLost, location, name, email, phone } = body ?? {};

    if (!itemDescription || typeof itemDescription !== "string" || !itemDescription.trim()) {
      return NextResponse.json({ error: "Describe the item you lost." }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const supabase = adminClient();

    const { data: row, error: insertErr } = await supabase
      .from("lost_found_reports")
      .insert({
        item_description: itemDescription.trim(),
        date_lost: dateLost || null,
        location: location?.trim() || null,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ error: insertErr?.message ?? "Could not save your report." }, { status: 500 });
    }

    let emailError: string | null = null;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      const adminEmail = process.env.LOST_FOUND_EMAIL || process.env.STORE_ORDER_EMAIL;
      if (!apiKey || !fromEmail || !adminEmail) {
        throw new Error("Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL / LOST_FOUND_EMAIL).");
      }
      const resend = new Resend(apiKey);
      const emailData = {
        itemDescription: row.item_description,
        dateLost: row.date_lost,
        location: row.location,
        name: row.name,
        email: row.email,
        phone: row.phone,
        createdAt: new Date(row.created_at),
      };

      const admin = adminLostFoundEmail(emailData);
      const sender = senderLostFoundEmail(emailData);

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
