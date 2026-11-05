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
  keyId: string
  keySecret: string
  webhookSecret?: string
  /** Capture as soon as the payment authorizes instead of when an admin captures it. */
  autoCapture?: boolean
}

type RazorpayOrder = { id: string; amount: number; amount_paid: number; currency: string; status: string; receipt?: string; notes?: Record<string, string> }
type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: "created" | "authorized" | "captured" | "refunded" | "failed"; method?: string }

const API = "https://api.razorpay.com/v1"

class RazorpayProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "razorpay"

  protected logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    if (!options.keyId || !options.keySecret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Razorpay needs `keyId` and `keySecret`")
    }
  }

  constructor(container: { logger: Logger }, options: Options) {
    super(container, options)
    this.logger_ = container.logger
  }

  protected async api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const auth = Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string; code?: string } }
    if (!res.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Razorpay: ${data.error?.description ?? res.statusText}`, data.error?.code)
    }
    return data
  }

  protected orderId(data?: Record<string, unknown>): string {
    const id = data?.razorpay_order_id
    if (typeof id !== "string") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Payment session has no Razorpay order")
    }
    return id
  }

  protected async createOrder(amount: InitiatePaymentInput["amount"], currency: string, sessionId?: string) {
    const order = await this.api<RazorpayOrder>("POST", "/orders", {
      amount: toPaise(amount),
      currency: currency.toUpperCase(),
      receipt: sessionId?.slice(0, 40),
      notes: sessionId ? { session_id: sessionId } : undefined,
    })
    return {
      id: order.id,
      data: {
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: this.config.keyId,
        session_id: sessionId,
      },
    }
  }

  /** The best payment on the order: captured beats authorized beats anything else. */
  protected async settledPayment(orderId: string): Promise<RazorpayPayment | undefined> {
    const { items } = await this.api<{ items: RazorpayPayment[] }>("GET", `/orders/${orderId}/payments`)
    return items.find((p) => p.status === "captured") ?? items.find((p) => p.status === "authorized")
  }

  protected statusOf(payment?: RazorpayPayment): PaymentSessionStatus {
    if (payment?.status === "captured") {
      return "captured"
    }
    if (payment?.status === "authorized") {
      return "authorized"
    }
    return "pending"
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = typeof input.data?.session_id === "string" ? input.data.session_id : undefined
    const { id, data } = await this.createOrder(input.amount, input.currency_code, sessionId)
    return { id, data, status: "pending" }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Razorpay orders are immutable, so an amount change needs a new order.
    if (input.data?.razorpay_order_id && toPaise(input.amount) === input.data.amount) {
      return { data: input.data, status: "pending" }
    }
    const sessionId = typeof input.data?.session_id === "string" ? input.data.session_id : undefined
    const { data } = await this.createOrder(input.amount, input.currency_code, sessionId)
    return { data, status: "pending" }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const orderId = this.orderId(input.data)
    let payment = await this.settledPayment(orderId)
    if (payment?.status === "authorized" && this.config.autoCapture) {
      payment = await this.api<RazorpayPayment>("POST", `/payments/${payment.id}/capture`, { amount: payment.amount, currency: payment.currency })
    }
    const status = this.statusOf(payment)
    return {
      status: status === "pending" ? "requires_more" : status,
      data: { ...input.data, razorpay_payment_id: payment?.id, razorpay_payment_status: payment?.status, method: payment?.method },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const orderId = this.orderId(input.data)
    const payment = await this.settledPayment(orderId)
    if (!payment) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No authorized Razorpay payment to capture")
    }
    const captured =
      payment.status === "captured"
        ? payment
        : await this.api<RazorpayPayment>("POST", `/payments/${payment.id}/capture`, { amount: payment.amount, currency: payment.currency })
    return { data: { ...input.data, razorpay_payment_id: captured.id, razorpay_payment_status: captured.status } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentId =
      typeof input.data?.razorpay_payment_id === "string"
        ? input.data.razorpay_payment_id
        : (await this.settledPayment(this.orderId(input.data)))?.id
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No Razorpay payment to refund")
    }
    const refund = await this.api<{ id: string; status: string }>("POST", `/payments/${paymentId}/refund`, { amount: toPaise(input.amount) })
    return { data: { ...input.data, last_refund_id: refund.id, last_refund_status: refund.status } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Razorpay has no order cancel; uncaptured authorizations are refunded by Razorpay automatically.
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const payment = await this.settledPayment(this.orderId(input.data))
    return { status: this.statusOf(payment), data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const order = await this.api<RazorpayOrder>("GET", `/orders/${this.orderId(input.data)}`)
    return { data: { ...input.data, razorpay_order: order } }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const signature = payload.headers["x-razorpay-signature"]
    if (!this.config.webhookSecret || typeof signature !== "string") {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    const expected = crypto.createHmac("sha256", this.config.webhookSecret).update(payload.rawData).digest("hex")
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      this.logger_.warn("Razorpay webhook signature mismatch")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const body = payload.data as {
      event?: string
      payload?: { payment?: { entity?: RazorpayPayment & { notes?: Record<string, string> } }; order?: { entity?: RazorpayOrder } }
    }
    const payment = body.payload?.payment?.entity
    if (!payment) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    // Payment events carry checkout notes, not the order's, so fall back to reading the order.
    const sessionId =
      payment.notes?.session_id ??
      body.payload?.order?.entity?.notes?.session_id ??
      (await this.api<RazorpayOrder>("GET", `/orders/${payment.order_id}`)).notes?.session_id
    if (!sessionId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    const data = { session_id: sessionId, amount: fromPaise(payment.amount) }

    switch (body.event) {
      case "payment.authorized":
        return { action: PaymentActions.AUTHORIZED, data }
      case "payment.captured":
      case "order.paid":
        return { action: PaymentActions.SUCCESSFUL, data }
      case "payment.failed":
        return { action: PaymentActions.FAILED, data }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default RazorpayProviderService
