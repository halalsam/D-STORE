type Line = { title: string; variant?: string; quantity: number; total: string }

export type TemplateData = {
  "order-placed": { order_id: string; display_id: string | number; first_name?: string; lines: Line[]; subtotal: string; shipping: string; discount?: string; total: string; address: string; order_url: string }
  "order-shipped": { display_id: string | number; first_name?: string; carrier?: string; tracking_number?: string; tracking_url?: string; order_url: string }
  "order-canceled": { display_id: string | number; first_name?: string; order_url: string }
  "customer-welcome": { first_name?: string; shop_url: string }
  "password-reset": { reset_url: string }
  "newsletter-welcome": { shop_url: string; code?: string }
}

export type TemplateName = keyof TemplateData

const NAVY = "#2F4156"
const BEIGE = "#F5EFEB"
const MUTED = "#566577"

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;font-size:13px">${esc(label)}</a>`
}

function layout(preheader: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:${BEIGE};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:${NAVY}">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 8px 24px;font-size:26px;font-weight:800;letter-spacing:-.04em">D-STORE</td></tr>
<tr><td style="background:#fff;border-radius:24px;padding:32px">${body}</td></tr>
<tr><td style="padding:24px 8px;font-size:12px;color:${MUTED}">D-STORE, Mumbai. You are receiving this because of your account or order with us.</td></tr>
</table></td></tr></table></body></html>`
}

function greeting(name?: string) {
  return `<p style="margin:0 0 16px;font-size:15px">Hi${name ? ` ${esc(name)}` : ""},</p>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;letter-spacing:-.02em">${esc(text)}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${MUTED}">${text}</p>`
}

function row(label: string, value: string, strong = false) {
  return `<tr><td style="padding:4px 0;font-size:14px;color:${MUTED}">${esc(label)}</td><td align="right" style="padding:4px 0;font-size:14px;${strong ? "font-weight:700;color:" + NAVY : ""}">${esc(value)}</td></tr>`
}

type Rendered = { subject: string; html: string; text: string }

const templates: { [K in TemplateName]: (d: TemplateData[K]) => Rendered } = {
  "order-placed": (d) => {
    const lines = d.lines
      .map((l) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">${esc(l.title)}${l.variant ? `<br><span style="color:${MUTED}">${esc(l.variant)} x ${l.quantity}</span>` : ` x ${l.quantity}`}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px">${esc(l.total)}</td></tr>`)
      .join("")
    return {
      subject: `Order #${d.display_id} confirmed`,
      html: layout(`We have your order #${d.display_id}.`, `${greeting(d.first_name)}${h1(`Order #${d.display_id} confirmed`)}${p("Thanks for shopping with us. We will email you again when it ships.")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">${lines}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">${row("Subtotal", d.subtotal)}${d.discount ? row("Discount", `-${d.discount}`) : ""}${row("Shipping", d.shipping)}${row("Total", d.total, true)}</table>
${p(`<strong style="color:${NAVY}">Shipping to</strong><br>${esc(d.address).replace(/\n/g, "<br>")}`)}${button(d.order_url, "View order")}`),
      text: `Order #${d.display_id} confirmed.\n\n${d.lines.map((l) => `${l.title} ${l.variant ?? ""} x ${l.quantity}  ${l.total}`).join("\n")}\n\nTotal: ${d.total}\nShipping to:\n${d.address}\n\n${d.order_url}`,
    }
  },
  "order-shipped": (d) => ({
    subject: `Order #${d.display_id} is on its way`,
    html: layout("Your order has shipped.", `${greeting(d.first_name)}${h1("Your order is on its way")}${p(
      `Order #${esc(d.display_id)} left our studio${d.carrier ? ` with ${esc(d.carrier)}` : ""}.${d.tracking_number ? ` Tracking number: <strong style="color:${NAVY}">${esc(d.tracking_number)}</strong>.` : ""}`
    )}${button(d.tracking_url ?? d.order_url, d.tracking_url ? "Track package" : "View order")}`),
    text: `Order #${d.display_id} has shipped.${d.tracking_number ? ` Tracking: ${d.tracking_number}` : ""}\n${d.tracking_url ?? d.order_url}`,
  }),
  "order-canceled": (d) => ({
    subject: `Order #${d.display_id} was cancelled`,
    html: layout("Your order was cancelled.", `${greeting(d.first_name)}${h1(`Order #${d.display_id} cancelled`)}${p("Any payment we took will be refunded to the original method within 5 to 7 business days.")}${button(d.order_url, "View order")}`),
    text: `Order #${d.display_id} was cancelled. Refunds reach the original payment method within 5 to 7 business days.\n${d.order_url}`,
  }),
  "customer-welcome": (d) => ({
    subject: "Welcome to D-STORE",
    html: layout("Your account is ready.", `${greeting(d.first_name)}${h1("Your account is ready")}${p("Save addresses, track orders and keep a list of pieces you like.")}${button(d.shop_url, "Shop new arrivals")}`),
    text: `Your D-STORE account is ready.\n${d.shop_url}`,
  }),
  "password-reset": (d) => ({
    subject: "Reset your D-STORE password",
    html: layout("Reset your password.", `${h1("Reset your password")}${p("Use the button below within 15 minutes. If you did not ask for this, ignore this email.")}${button(d.reset_url, "Reset password")}`),
    text: `Reset your password (valid 15 minutes): ${d.reset_url}`,
  }),
  "newsletter-welcome": (d) => ({
    subject: "You are on the D-STORE list",
    html: layout("New drops, first.", `${h1("You are on the list")}${p(`New drops reach you before anyone else.${d.code ? ` Use <strong style="color:${NAVY}">${esc(d.code)}</strong> for 10% off your first order.` : ""}`)}${button(d.shop_url, "Shop new arrivals")}`),
    text: `You are on the D-STORE list.${d.code ? ` Use ${d.code} for 10% off.` : ""}\n${d.shop_url}`,
  }),
}

export function render(name: string, data: Record<string, unknown>): Rendered | undefined {
  const fn = templates[name as TemplateName] as ((d: unknown) => Rendered) | undefined
  return fn?.(data)
}
