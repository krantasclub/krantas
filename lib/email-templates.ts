// Branded transactional emails for the store. Two are sent per order:
// one to the admin inbox (STORE_ORDER_EMAIL) and one to the buyer —
// see app/api/store/order/route.ts.
//
// Email clients don't load external stylesheets or the site's fonts
// reliably, so everything here is inline styles + a table layout, and
// text falls back to system fonts. Colors are lifted straight from
// app/globals.css so the emails still read as "Krantas".

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://krantas.lt";

const COLORS = {
  bg: "#f2efe8", // outer backdrop — most inboxes render on white/light, so
  //                the dark card sits on a warm off-white rather than
  //                assuming a dark inbox theme.
  card: "#0a0c0d",
  cardRaised: "#12181a",
  ink: "#ece7dd",
  inkDim: "#9aa19d",
  accent: "#ff8a1e",
  line: "rgba(236,231,221,0.14)",
};

export type OrderEmailData = {
  productName: string;
  priceLabel: string;
  size?: string | null;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  createdAt: Date;
};

function row(label: string, value?: string | null) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:6px 0;font:12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};text-transform:uppercase;letter-spacing:0.08em;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0 6px 16px;font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};">${value}</td>
    </tr>`;
}

function shell(opts: { preheader: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Krantas</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.bg};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.card};border:1px solid ${COLORS.line};">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid ${COLORS.line};" align="left">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <img src="${SITE_URL}/logo-round.png" width="36" height="36" alt="Krantas" style="display:block;border-radius:50%;" />
                    </td>
                    <td style="font:700 22px/1 Georgia,'Times New Roman',serif;letter-spacing:0.04em;color:${COLORS.ink};">KRANTAS</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${COLORS.line};font:11px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};text-transform:uppercase;letter-spacing:0.1em;">
                Krantas · 92120 Klaipėda, Lietuva
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function adminOrderEmail(order: OrderEmailData) {
  const total = order.quantity > 1 ? ` · qty ${order.quantity}` : "";
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">New store order</p>
    <h1 style="margin:0 0 20px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">${order.productName}${total}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};padding-top:4px;">
      ${row("Price", order.priceLabel)}
      ${row("Size", order.size)}
      ${row("Quantity", String(order.quantity))}
      ${row("Buyer", order.customerName)}
      ${row("Email", `<a href="mailto:${order.customerEmail}" style="color:${COLORS.accent};text-decoration:none;">${order.customerEmail}</a>`)}
      ${row("Phone", order.customerPhone)}
      ${row("Ship to", order.shippingAddress)}
      ${row("Notes", order.notes)}
      ${row("Received", order.createdAt.toLocaleString("lt-LT", { dateStyle: "medium", timeStyle: "short" }))}
    </table>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Reply directly to this email to reach the buyer, or manage this order in the
      <a href="${SITE_URL}/admin/orders" style="color:${COLORS.accent};">control panel</a>.
    </p>`;
  return {
    subject: `New order · ${order.productName}`,
    html: shell({ preheader: `New order for ${order.productName} from ${order.customerName}`, bodyHtml }),
  };
}

// ── Contact form ─────────────────────────────────────────────────────────

export type ContactEmailData = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  createdAt: Date;
};

export function adminContactEmail(msg: ContactEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">New contact message</p>
    <h1 style="margin:0 0 20px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">${msg.subject || "Website enquiry"}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};padding-top:4px;">
      ${row("From", msg.name)}
      ${row("Email", `<a href="mailto:${msg.email}" style="color:${COLORS.accent};text-decoration:none;">${msg.email}</a>`)}
      ${row("Phone", msg.phone)}
      ${row("Received", msg.createdAt.toLocaleString("lt-LT", { dateStyle: "medium", timeStyle: "short" }))}
    </table>
    <p style="margin:20px 0 0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;white-space:pre-wrap;">${msg.message}</p>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Reply directly to this email to reach them, or manage messages in the
      <a href="${SITE_URL}/admin/inquiries" style="color:${COLORS.accent};">control panel</a>.
    </p>`;
  return {
    subject: `Contact: ${msg.subject || "New message"} — ${msg.name}`,
    html: shell({ preheader: `New contact message from ${msg.name}`, bodyHtml }),
  };
}

export function senderContactEmail(msg: ContactEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">Message received</p>
    <h1 style="margin:0 0 12px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">Thanks, ${msg.name.split(" ")[0]}!</h1>
    <p style="margin:0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;">
      We've got your message and will get back to you at this email address soon.
    </p>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Need to add anything? Just reply to this email.
    </p>`;
  return {
    subject: "We got your message — Krantas",
    html: shell({ preheader: "We've got your message and will get back to you soon", bodyHtml }),
  };
}

// ── Booking requests ─────────────────────────────────────────────────────

export type BookingEmailData = {
  requestType: string;
  name: string;
  email: string;
  phone?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  message: string;
  createdAt: Date;
};

const REQUEST_TYPE_LABEL: Record<string, string> = {
  dj_booking: "DJ / artist booking",
  private_event: "Private event",
  other: "Other enquiry",
};

export function adminBookingEmail(b: BookingEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">New booking request</p>
    <h1 style="margin:0 0 20px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">${REQUEST_TYPE_LABEL[b.requestType] ?? b.requestType}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};padding-top:4px;">
      ${row("From", b.name)}
      ${row("Email", `<a href="mailto:${b.email}" style="color:${COLORS.accent};text-decoration:none;">${b.email}</a>`)}
      ${row("Phone", b.phone)}
      ${row("Event date", b.eventDate)}
      ${row("Guests", b.guestCount ? String(b.guestCount) : null)}
      ${row("Received", b.createdAt.toLocaleString("lt-LT", { dateStyle: "medium", timeStyle: "short" }))}
    </table>
    <p style="margin:20px 0 0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;white-space:pre-wrap;">${b.message}</p>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Reply directly to this email to reach them, or manage requests in the
      <a href="${SITE_URL}/admin/inquiries" style="color:${COLORS.accent};">control panel</a>.
    </p>`;
  return {
    subject: `Booking: ${REQUEST_TYPE_LABEL[b.requestType] ?? b.requestType} — ${b.name}`,
    html: shell({ preheader: `New booking request from ${b.name}`, bodyHtml }),
  };
}

export function senderBookingEmail(b: BookingEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">Request received</p>
    <h1 style="margin:0 0 12px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">Thanks, ${b.name.split(" ")[0]}!</h1>
    <p style="margin:0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;">
      We've got your booking request and will follow up at this email address soon.
    </p>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Need to add anything? Just reply to this email.
    </p>`;
  return {
    subject: "We got your booking request — Krantas",
    html: shell({ preheader: "We've got your booking request and will follow up soon", bodyHtml }),
  };
}

// ── Lost & found ─────────────────────────────────────────────────────────

export type LostFoundEmailData = {
  itemDescription: string;
  dateLost?: string | null;
  location?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: Date;
};

export function adminLostFoundEmail(l: LostFoundEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">New lost & found report</p>
    <h1 style="margin:0 0 20px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">${l.itemDescription}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};padding-top:4px;">
      ${row("Date lost", l.dateLost)}
      ${row("Last seen", l.location)}
      ${row("From", l.name)}
      ${row("Email", `<a href="mailto:${l.email}" style="color:${COLORS.accent};text-decoration:none;">${l.email}</a>`)}
      ${row("Phone", l.phone)}
      ${row("Received", l.createdAt.toLocaleString("lt-LT", { dateStyle: "medium", timeStyle: "short" }))}
    </table>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Reply directly to this email to reach them, or manage reports in the
      <a href="${SITE_URL}/admin/inquiries" style="color:${COLORS.accent};">control panel</a>.
    </p>`;
  return {
    subject: `Lost & found: ${l.itemDescription} — ${l.name}`,
    html: shell({ preheader: `New lost & found report from ${l.name}`, bodyHtml }),
  };
}

export function senderLostFoundEmail(l: LostFoundEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">Report received</p>
    <h1 style="margin:0 0 12px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">Thanks, ${l.name.split(" ")[0]}!</h1>
    <p style="margin:0;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;">
      We've logged your lost item report for <strong>${l.itemDescription}</strong>. If it turns up, we'll reach
      out at this email address (or by phone, if you left one).
    </p>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Need to add anything? Just reply to this email.
    </p>`;
  return {
    subject: "We logged your lost item — Krantas",
    html: shell({ preheader: `We've logged your report for ${l.itemDescription}`, bodyHtml }),
  };
}

export function customerOrderEmail(order: OrderEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 4px;font:11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.accent};text-transform:uppercase;letter-spacing:0.14em;">Order received</p>
    <h1 style="margin:0 0 12px;font:400 28px/1.1 Georgia,'Times New Roman',serif;color:${COLORS.ink};">Thanks, ${order.customerName.split(" ")[0]}!</h1>
    <p style="margin:0 0 20px;font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.ink};opacity:0.9;">
      We've got your order for <strong>${order.productName}</strong>. We'll reach out shortly at this
      email address (or by phone, if you left one) to sort out payment and delivery or pickup.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${COLORS.line};padding-top:4px;">
      ${row("Item", order.productName)}
      ${row("Price", order.priceLabel)}
      ${row("Size", order.size)}
      ${row("Quantity", String(order.quantity))}
    </table>
    <p style="margin:24px 0 0;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:${COLORS.inkDim};">
      Questions about your order? Just reply to this email.
    </p>`;
  return {
    subject: `Your Krantas order — ${order.productName}`,
    html: shell({ preheader: `We've got your order for ${order.productName}`, bodyHtml }),
  };
}
