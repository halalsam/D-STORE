import { MedusaError } from "@medusajs/framework/utils"

const API = "https://apiv2.shiprocket.in/v1/external"

export type ShiprocketCredentials = { email: string; password: string }

export type Courier = {
  courier_company_id: number
  courier_name: string
  rate: number
  estimated_delivery_days?: string
  etd?: string
  cod?: number
}

export class ShiprocketClient {
  protected token_?: { value: string; expiresAt: number }

  constructor(protected credentials: ShiprocketCredentials) {}

  protected async token() {
    if (this.token_ && this.token_.expiresAt > Date.now()) {
      return this.token_.value
    }
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(this.credentials),
    })
    const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string }
    if (!res.ok || !data.token) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Shiprocket login failed: ${data.message ?? res.statusText}`)
    }
    // Tokens last 10 days; refresh well before that.
    this.token_ = { value: data.token, expiresAt: Date.now() + 8 * 24 * 3600 * 1000 }
    return data.token
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Bearer ${await this.token()}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (res.status === 401) {
      this.token_ = undefined
    }
    const data = (await res.json().catch(() => ({}))) as T & { message?: string; errors?: unknown }
    if (!res.ok) {
      const detail = data.errors ? ` ${JSON.stringify(data.errors)}` : ""
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Shiprocket ${path}: ${data.message ?? res.statusText}${detail}`)
    }
    return data
  }

  async serviceability(input: { pickup: string; delivery: string; weightKg: number; cod: boolean }) {
    const params = new URLSearchParams({
      pickup_postcode: input.pickup,
      delivery_postcode: input.delivery,
      weight: String(Math.max(input.weightKg, 0.1)),
      cod: input.cod ? "1" : "0",
    })
    const res = await this.request<{ status: number; data?: { available_courier_companies: Courier[]; recommended_courier_company_id?: number } }>(
      "GET",
      `/courier/serviceability/?${params}`
    )
    return { couriers: res.data?.available_courier_companies ?? [], recommended: res.data?.recommended_courier_company_id }
  }
}
