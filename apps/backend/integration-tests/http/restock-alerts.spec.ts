import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import sendRestockAlerts from "../../src/jobs/send-restock-alerts"

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>
    let variantId: string
    let inventoryItemId: string
    let locationId: string

    beforeEach(async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: [store] } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
      const channelId = store.default_sales_channel_id as string
      const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "store", type: "publishable", created_by: "test" }] } })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channelId] } })
      const { result: [location] } = await createStockLocationsWorkflow(container).run({ input: { locations: [{ name: "Mumbai" }] } })
      await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [channelId] } })
      const { result: [product] } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: "Moth Signal Tee",
              handle: "moth-signal-tee",
              status: "published",
              sales_channels: [{ id: channelId }],
              options: [{ title: "Size", values: ["M"] }],
              variants: [{ title: "M", sku: "TEE-M", manage_inventory: true, options: { Size: "M" }, prices: [{ amount: 999, currency_code: "inr" }] }],
            },
          ],
        },
      })
      const { data: [item] } = await query.graph({ entity: "inventory_item", fields: ["id"], filters: { sku: "TEE-M" } })
      await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [{ inventory_item_id: item.id, location_id: location.id, stocked_quantity: 0 }] } })
      headers = { "x-publishable-api-key": key.token }
      variantId = product.variants[0].id
      inventoryItemId = item.id
      locationId = location.id
    })

    const sent = async () => (await getContainer().resolve(Modules.NOTIFICATION).listNotifications({ template: "back-in-stock" })).map((n) => n.to)

    it("emails once when the size is back, and re-arms on a new subscription", async () => {
      await api.post("/store/restock-subscriptions", { variant_id: variantId, email: "Asha@Example.com" }, { headers })
      await api.post("/store/restock-subscriptions", { variant_id: variantId, email: "asha@example.com" }, { headers })

      await sendRestockAlerts(getContainer())
      expect(await sent()).toEqual([])

      await updateInventoryLevelsWorkflow(getContainer()).run({ input: { updates: [{ inventory_item_id: inventoryItemId, location_id: locationId, stocked_quantity: 5 }] } })
      await sendRestockAlerts(getContainer())
      await sendRestockAlerts(getContainer())
      expect(await sent()).toEqual(["asha@example.com"])

      await api.post("/store/restock-subscriptions", { variant_id: variantId, email: "asha@example.com" }, { headers })
      await sendRestockAlerts(getContainer())
      expect(await sent()).toEqual(["asha@example.com", "asha@example.com"])
    })

    it("rejects unknown variants and bad emails", async () => {
      const unknown = await api.post("/store/restock-subscriptions", { variant_id: "variant_nope", email: "asha@example.com" }, { headers }).catch((e) => e.response)
      expect(unknown.status).toEqual(404)
      const bad = await api.post("/store/restock-subscriptions", { variant_id: variantId, email: "not-an-email" }, { headers }).catch((e) => e.response)
      expect(bad.status).toEqual(400)
    })
  },
})
