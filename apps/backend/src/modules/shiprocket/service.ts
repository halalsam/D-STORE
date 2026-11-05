import type {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  Logger,
} from "@medusajs/framework/types"
import { AbstractFulfillmentProviderService, MedusaError } from "@medusajs/framework/utils"
import { ShiprocketClient, type Courier } from "./client"

type Options = {
  email: string
  password: string
  /** Pickup location nickname exactly as set in the Shiprocket panel. */
  pickupLocation: string
  pickupPostcode: string
  /** Grams per unit when a variant has no weight. */
  defaultItemWeightGrams?: number
  /** Parcel size in cm. */
  defaultDimensions?: { length: number; breadth: number; height: number }
  /** Request a pickup right after the AWB is assigned. */
  autoPickup?: boolean
}



const OPTIONS: FulfillmentOption[] = [
  { id: "shiprocket-standard", name: "Shiprocket Standard", is_return: false },
  { id: "shiprocket-express", name: "Shiprocket Express", is_return: false },
  { id: "shiprocket-return", name: "Shiprocket Return", is_return: true },
]

function pickCourier(option: string | undefined, couriers: Courier[], recommended?: number) {
  if (!couriers.length) {
    return undefined
  }
  if (option === "shiprocket-express") {
    return [...couriers].sort((a, b) => Number(a.estimated_delivery_days ?? 99) - Number(b.estimated_delivery_days ?? 99) || a.rate - b.rate)[0]
  }
  return couriers.find((c) => c.courier_company_id === recommended) ?? [...couriers].sort((a, b) => a.rate - b.rate)[0]
}

function orderDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

class ShiprocketFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shiprocket"

  protected client_: ShiprocketClient
  protected options_: Options
  protected logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    for (const key of ["email", "password", "pickupLocation", "pickupPostcode"]) {
      if (!options[key]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Shiprocket needs \`${key}\``)
      }
    }
  }

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client_ = new ShiprocketClient({ email: options.email, password: options.password })
  }

  protected get unitWeightKg() {
    return (this.options_.defaultItemWeightGrams ?? 400) / 1000
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return OPTIONS
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return OPTIONS.some((o) => o.id === data.id)
  }

  async validateFulfillmentData(optionData: Record<string, unknown>, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return { ...data, option_id: optionData.id }
  }

  async canCalculate(): Promise<boolean> {
    return true
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const delivery = context.shipping_address?.postal_code
    if (!delivery) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A delivery pincode is needed to price Shiprocket shipping")
    }
    const weightKg = (context.items ?? []).reduce((sum, item) => {
      const grams = item.variant?.weight
      return sum + Number(item.quantity) * (grams ? grams / 1000 : this.unitWeightKg)
    }, 0)
    const { couriers, recommended } = await this.client_.serviceability({
      pickup: this.options_.pickupPostcode,
      delivery,
      weightKg,
      cod: data?.cod === true,
    })
    const courier = pickCourier(optionData.id as string, couriers, recommended)
    if (!courier) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `No Shiprocket courier delivers to ${delivery}`)
    }
    return { calculated_amount: Math.ceil(courier.rate), is_calculated_price_tax_inclusive: true }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    const address = order?.shipping_address ?? fulfillment.delivery_address
    if (!order || !address?.postal_code) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Shiprocket needs the order and its shipping address")
    }
    const lineById = new Map((order.items ?? []).map((l) => [l.id, l]))
    const orderItems = items.map((item) => {
      const line = item.line_item_id ? lineById.get(item.line_item_id) : undefined
      return {
        name: item.title ?? line?.title ?? "Item",
        sku: item.sku || line?.variant_sku || item.line_item_id || "sku",
        units: Number(item.quantity ?? 1),
        selling_price: Number(line?.unit_price ?? 0),
      }
    })
    const units = orderItems.reduce((n, i) => n + i.units, 0)
    const cod = order.metadata?.payment_method === "cod"
    const dims = this.options_.defaultDimensions ?? { length: 30, breadth: 25, height: 5 }
    const reference = `${order.display_id ?? order.id}-${(fulfillment.id ?? Date.now().toString(36)).slice(-6)}`

    const created = await this.client_.request<{ order_id: number; shipment_id: number; status: string }>("POST", "/orders/create/adhoc", {
      order_id: reference,
      order_date: orderDate(new Date()),
      pickup_location: this.options_.pickupLocation,
      billing_customer_name: address.first_name ?? "",
      billing_last_name: address.last_name ?? "",
      billing_address: address.address_1 ?? "",
      billing_address_2: address.address_2 ?? "",
      billing_city: address.city ?? "",
      billing_pincode: address.postal_code,
      billing_state: address.province ?? "",
      billing_country: "India",
      billing_email: order.email ?? "",
      billing_phone: (address.phone ?? "").replace(/\D/g, "").slice(-10),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: cod ? "COD" : "Prepaid",
      sub_total: orderItems.reduce((n, i) => n + i.selling_price * i.units, 0),
      length: dims.length,
      breadth: dims.breadth,
      height: dims.height,
      weight: Math.max(units * this.unitWeightKg, 0.1),
    })

    const awb = await this.client_.request<{ awb_assign_status: number; response?: { data?: { awb_code: string; courier_name: string; courier_company_id: number } } }>(
      "POST",
      "/courier/assign/awb",
      { shipment_id: created.shipment_id }
    )
    const awbData = awb.response?.data
    if (!awbData?.awb_code) {
      this.logger_.warn(`Shiprocket order ${created.order_id} created but no AWB assigned yet`)
    }

    let labelUrl = ""
    if (awbData?.awb_code) {
      if (this.options_.autoPickup !== false) {
        await this.client_.request("POST", "/courier/generate/pickup", { shipment_id: [created.shipment_id] }).catch((e: Error) => this.logger_.warn(e.message))
      }
      const label = await this.client_
        .request<{ label_url?: string }>("POST", "/courier/generate/label", { shipment_id: [created.shipment_id] })
        .catch(() => ({ label_url: "" }))
      labelUrl = label.label_url ?? ""
    }

    return {
      data: {
        ...data,
        shiprocket_order_id: created.order_id,
        shipment_id: created.shipment_id,
        awb_code: awbData?.awb_code,
        courier_name: awbData?.courier_name,
        payment_method: cod ? "COD" : "Prepaid",
      },
      labels: awbData?.awb_code
        ? [{ tracking_number: awbData.awb_code, tracking_url: `https://shiprocket.co/tracking/${awbData.awb_code}`, label_url: labelUrl }]
        : [],
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (data.shiprocket_order_id) {
      await this.client_.request("POST", "/orders/cancel", { ids: [data.shiprocket_order_id] })
    }
    return { ...data, canceled: true }
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    // Returns are booked from the Shiprocket panel; the fulfillment records them in Medusa.
    return { data: { ...fulfillment, return_booked_in_panel: true }, labels: [] }
  }

  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    void data
    return []
  }
}

export default ShiprocketFulfillmentService
