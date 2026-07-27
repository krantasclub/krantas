import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { adminBookingEmail, senderBookingEmail } from "@/lib/email-templates";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createClient(url, key, { auth: { persistSession: false } });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_TYPES = ["dj_booking", "private_event", "other"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestType, name, email, phone, eventDate, guestCount, message } = body ?? {};

    const type = REQUEST_TYPES.includes(requestType) ? requestType : "other";

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Tell us a bit about the event or booking." }, { status: 400 });
    }
    const guests = guestCount ? Number(guestCount) : null;
    if (guests !== null && (!Number.isFinite(guests) || guests < 0)) {
      return NextResponse.json({ error: "Guest count doesn't look right." }, { status: 400 });
    }

    const supabase = adminClient();

    const { data: row, error: insertErr } = await supabase
      .from("booking_requests")
      .insert({
        request_type: type,
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        event_date: eventDate || null,
        guest_count: guests,
        message: message.trim(),
      })
      .select()
      .single();

    if (insertErr || !row) {
      return NextResponse.json({ error: insertErr?.message ?? "Could not save your request." }, { status: 500 });
    }

    let emailError: string | null = null;
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL;
      const adminEmail = process.env.BOOKING_EMAIL || process.env.STORE_ORDER_EMAIL;
      if (!apiKey || !fromEmail || !adminEmail) {
        throw new Error("Resend is not configured (RESEND_API_KEY / RESEND_FROM_EMAIL / BOOKING_EMAIL).");
      }
      const resend = new Resend(apiKey);
      const emailData = {
        requestType: row.request_type,
        name: row.name,
        email: row.email,
        phone: row.phone,
        eventDate: row.event_date,
        guestCount: row.guest_count,
        message: row.message,
        createdAt: new Date(row.created_at),
      };

      const admin = adminBookingEmail(emailData);
      const sender = senderBookingEmail(emailData);

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
