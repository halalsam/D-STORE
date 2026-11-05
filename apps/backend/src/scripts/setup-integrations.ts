import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createShippingOptionsWorkflow, updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Connects configured integrations to the India region and Mumbai warehouse.
 * Idempotent; re-run after adding Razorpay, PhonePe or Shiprocket keys:
 *   pnpm --filter @d-store/backend run setup:integrations
 */
export default async function setupIntegrations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const {
    data: [region],
  } = await query.graph({ entity: "region", fields: ["id", "payment_providers.id"], filters: { name: "India" } })
  if (!region) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Run seed:dstore first: no India region")
  }

  const enabled = await container.resolve(Modules.PAYMENT).listPaymentProviders({ is_enabled: true })
  const wanted = ["pp_system_default", "pp_razorpay_razorpay", "pp_phonepe_phonepe"].filter((id) => enabled.some((p) => p.id === id))
  const current = (region.payment_providers ?? []).map((p) => p!.id)
  const providers = [...new Set([...current, ...wanted])].filter((id) => enabled.some((p) => p.id === id))
  if (providers.length !== current.length || providers.some((id) => !current.includes(id))) {
    await updateRegionsWorkflow(container).run({ input: { selector: { id: region.id }, update: { payment_providers: providers } } })
  }
  logger.info(`[integrations] India payment providers: ${providers.join(", ")}`)

  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const [shiprocket] = await fulfillment.listFulfillmentProviders({ id: "shiprocket_shiprocket" })
  if (!shiprocket) {
    logger.info("[integrations] Shiprocket not configured, skipping shipping options")
    return
  }

  const {
    data: [location],
  } = await query.graph({
    entity: "stock_location",
    fields: ["id", "fulfillment_providers.id", "fulfillment_sets.service_zones.id"],
    filters: { name: "Mumbai Warehouse" },
  })
  if (!location) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Run seed:dstore first: no Mumbai Warehouse")
  }
  if (!(location.fulfillment_providers ?? []).some((p) => p?.id === shiprocket.id)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: shiprocket.id },
    })
  }

  const serviceZoneId = location.fulfillment_sets?.[0]?.service_zones?.[0]?.id
  if (!serviceZoneId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Mumbai Warehouse has no service zone")
  }
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: existing } = await query.graph({ entity: "shipping_option", fields: ["name"], filters: { service_zone_id: serviceZoneId } })

  const options = [
    { id: "shiprocket-standard", name: "Standard delivery (Shiprocket)", code: "sr-standard", description: "Cheapest courier, 3 to 7 business days" },
    { id: "shiprocket-express", name: "Express delivery (Shiprocket)", code: "sr-express", description: "Fastest courier to your pincode" },
  ]
    .filter((o) => !existing.some((e) => e.name === o.name))
    .map((o) => ({
      name: o.name,
      price_type: "calculated" as const,
      provider_id: shiprocket.id,
      service_zone_id: serviceZoneId,
      shipping_profile_id: profiles[0].id,
      data: { id: o.id },
      type: { label: o.name, description: o.description, code: o.code },
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
        { attribute: "is_return", value: "false", operator: "eq" as const },
      ],
    }))
  if (options.length) {
    await createShippingOptionsWorkflow(container).run({ input: options })
  }
  logger.info(`[integrations] Shiprocket shipping options ready (${options.length} created)`)
}
