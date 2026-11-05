import crypto from "node:crypto"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { AbstractPaymentProvider, MedusaError, PaymentActions } from "@medusajs/framework/utils"
import { fromPaise, toPaise } from "../../lib/money"

type Options = {
  clientId: string
  clientSecret: string
  clientVersion: string | number
  /** "sandbox" (default) or "production". */
  env?: "sandbox" | "production"
  /** Storefront page PhonePe sends the shopper back to; `?session=<id>` is appended. */
  redirectUrl: string
  /** Username and password set for the webhook in the PhonePe dashboard. */
  webhookUsername?: string
  webhookPassword?: string
}

type OrderState = "PENDING" | "COMPLETED" | "FAILED"
type OrderStatus = { orderId: string; state: OrderState; amount: number; paymentDetails?: { transactionId: string; paymentMode?: string; state: string }[] }

const HOSTS = {
  sandbox: { auth: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token", pg: "https://api-preprod.phonepe.com/apis/pg-sandbox" },
  production: { auth: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token", pg: "https://api.phonepe.com/apis/pg" },
}

class PhonePeProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "phonepe"

  protected logger_: Logger
  protected token_?: { value: string; expiresAt: number }

  static validateOptions(options: Record<string, unknown>) {
    for (const key of ["clientId", "clientSecret", "clientVersion", "redirectUrl"]) {
      if (!options[key]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `PhonePe needs \`${key}\``)
      }
    }
  }

  constructor(container: { logger: Logger }, options: Options) {
    super(container, options)
    this.logger_ = container.logger
  }

  protected get hosts() {
    return HOSTS[this.config.env === "production" ? "production" : "sandbox"]
  }

  protected async token(): Promise<string> {
    if (this.token_ && this.token_.expiresAt - 60_000 > Date.now()) {
      return this.token_.value
    }
    const res = await fetch(this.hosts.auth, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        client_version: String(this.config.clientVersion),
        grant_type: "client_credentials",
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_at?: number; message?: string }
    if (!res.ok || !data.access_token) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PhonePe auth failed: ${data.message ?? res.statusText}`)
    }
    this.token_ = { value: data.access_token, expiresAt: (data.expires_at ?? 0) * 1000 || Date.now() + 10 * 60_000 }
    return this.token_.value
  }

  protected async api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.hosts.pg}${path}`, {
      method,
      headers: { authorization: `O-Bearer ${await this.token()}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as T & { message?: string; code?: string }
    if (!res.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PhonePe: ${data.message ?? res.statusText}`, data.code)
    }
    return data
  }

  protected merchantOrderId(data?: Record<string, unknown>): string {
    const id = data?.merchant_order_id
    if (typeof id !== "string") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Payment session has no PhonePe order")
    }
    return id
  }

  protected async createOrder(amount: InitiatePaymentInput["amount"], sessionId: string) {
    // A fresh merchant order id per attempt: PhonePe rejects reusing one.
    const merchantOrderId = `${sessionId}-${Date.now().toString(36)}`.replace(/[^\w-]/g, "").slice(0, 63)
    const redirect = new URL(this.config.redirectUrl)
    redirect.searchParams.set("session", sessionId)
    const order = await this.api<{ orderId: string; state: OrderState; redirectUrl: string; expireAt: number }>("POST", "/checkout/v2/pay", {
      merchantOrderId,
      amount: toPaise(amount),
      expireAfter: 1200,
      metaInfo: { udf1: sessionId },
      paymentFlow: { type: "PG_CHECKOUT", merchantUrls: { redirectUrl: redirect.toString() } },
    })
    return {
      merchant_order_id: merchantOrderId,
      phonepe_order_id: order.orderId,
      redirect_url: order.redirectUrl,
      amount: toPaise(amount),
      session_id: sessionId,
    }
  }

  protected async status(data?: Record<string, unknown>): Promise<{ status: PaymentSessionStatus; order: OrderStatus }> {
    const order = await this.api<OrderStatus>("GET", `/checkout/v2/order/${this.merchantOrderId(data)}/status`)
    const status: PaymentSessionStatus = order.state === "COMPLETED" ? "captured" : order.state === "FAILED" ? "error" : "pending"
    return { status, order }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = typeof input.data?.session_id === "string" ? input.data.session_id : crypto.randomUUID()
    const data = await this.createOrder(input.amount, sessionId)
    return { id: data.merchant_order_id, data, status: "pending" }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    if (input.data?.merchant_order_id && input.data.amount === toPaise(input.amount)) {
      return { data: input.data, status: "pending" }
    }
    const sessionId = typeof input.data?.session_id === "string" ? input.data.session_id : crypto.randomUUID()
    return { data: await this.createOrder(input.amount, sessionId), status: "pending" }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { status, order } = await this.status(input.data)
    const tx = order.paymentDetails?.find((p) => p.state === "COMPLETED")
    return {
      status: status === "pending" ? "requires_more" : status,
      data: { ...input.data, phonepe_state: order.state, transaction_id: tx?.transactionId, payment_mode: tx?.paymentMode },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // PhonePe captures on completion; nothing to do.
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const merchantRefundId = `${this.merchantOrderId(input.data)}-r${Date.now().toString(36)}`.slice(0, 63)
    const refund = await this.api<{ refundId: string; state: string }>("POST", "/payments/v2/refund", {
      merchantRefundId,
      originalMerchantOrderId: this.merchantOrderId(input.data),
      amount: toPaise(input.amount),
    })
    return { data: { ...input.data, last_refund_id: refund.refundId, last_refund_state: refund.state } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { status } = await this.status(input.data)
    return { status, data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const { order } = await this.status(input.data)
    return { data: { ...input.data, phonepe_order: order } }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const { webhookUsername, webhookPassword } = this.config
    const header = payload.headers["authorization"]
    if (!webhookUsername || !webhookPassword || typeof header !== "string") {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    const expected = crypto.createHash("sha256").update(`${webhookUsername}:${webhookPassword}`).digest("hex")
    const given = header.replace(/^SHA256\s*/i, "").trim().toLowerCase()
    if (given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
      this.logger_.warn("PhonePe webhook authorization mismatch")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const body = payload.data as { event?: string; payload?: { state?: OrderState; amount?: number; metaInfo?: { udf1?: string } } }
    const sessionId = body.payload?.metaInfo?.udf1
    if (!sessionId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    const data = { session_id: sessionId, amount: fromPaise(body.payload?.amount ?? 0) }
    if (body.event === "checkout.order.completed" && body.payload?.state === "COMPLETED") {
      return { action: PaymentActions.SUCCESSFUL, data }
    }
    if (body.event === "checkout.order.failed") {
      return { action: PaymentActions.FAILED, data }
    }
    return { action: PaymentActions.NOT_SUPPORTED }
  }
}

export default PhonePeProviderService
