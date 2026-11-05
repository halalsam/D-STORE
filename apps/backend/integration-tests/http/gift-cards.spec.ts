import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createProductsWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import { createGiftCardsWorkflow } from "@medusajs/loyalty-plugin/workflows"
import sendGiftCardCodes from "../../src/jobs/send-gift-card-codes"

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let headers: Record<string, string>
    let regionId: string
    let variantId: string

    beforeEach(async () => {
      const container = getContainer()
      const { result: [channel] } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: "Web" }] } })
      const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "store", type: "publishable", created_by: "test" }] } })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
      const { result: [region] } = await createRegionsWorkflow(container).run({
        input: { regions: [{ name: "India", currency_code: "inr", countries: ["in"], payment_providers: ["pp_system_default"] }] },
      })
      const { result: [product] } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: "Gift Card",
              handle: "gift-card",
              is_giftcard: true,
              discountable: false,
              status: "published",
              sales_channels: [{ id: channel.id }],
              options: [{ title: "Amount", values: ["1000"] }],
              variants: [{ title: "1000", manage_inventory: false, options: { Amount: "1000" }, prices: [{ amount: 1000, currency_code: "inr" }] }],
            },
          ],
        },
      })
      headers = { "x-publishable-api-key": key.token }
      regionId = region.id
      variantId = product.variants[0].id
    })

    const giftCardCart = async (extra: Record<string, string> = {}) => {
      const { data } = await api.post("/store/carts", { region_id: regionId, email: "asha@example.com" }, { headers: { ...headers, ...extra } })
      await api.post(`/store/carts/${data.cart.id}/line-items`, { variant_id: variantId, quantity: 1 }, { headers: { ...headers, ...extra } })
      return data.cart.id as string
    }

    it("refuses cash on delivery for gift cards", async () => {
      const cartId = await giftCardCart()
      const { data: pc } = await api.post("/store/payment-collections", { cart_id: cartId }, { headers })
      await api.post(`/store/payment-collections/${pc.payment_collection.id}/payment-sessions`, { provider_id: "pp_system_default" }, { headers })
      const res = await api.post(`/store/carts/${cartId}/complete`, {}, { headers }).catch((e) => e.response)
      expect(JSON.stringify(res.data)).toMatch(/cash on delivery/)
      const { data } = await api.get(`/store/carts/${cartId}?fields=completed_at`, { headers })
      expect(data.cart.completed_at).toBeFalsy()
    })

    it("emails each code once, lets the customer claim it and pay with store credit", async () => {
      const container = getContainer()
      const order = await container.resolve(Modules.ORDER).createOrders({
        email: "buyer@example.com",
        currency_code: "inr",
        items: [{ title: "Gift Card", quantity: 1, unit_price: 1000, metadata: { gift_card: true, gift_recipient_email: "friend@example.com", gift_recipient_name: "Ravi", gift_message: "Happy birthday" } }],
      })
      const full = await container.resolve(Modules.ORDER).retrieveOrder(order.id, { relations: ["items"] })
      const { result: [card] } = await createGiftCardsWorkflow(container).run({
        // Same input the plugin's own order.placed subscriber passes (code is generated).
        input: [{ value: 1000, currency_code: "inr", reference: "order", reference_id: order.id, line_item_id: full.items![0].id, metadata: {} }] as never,
      })

      await sendGiftCardCodes(container)
      await sendGiftCardCodes(container)
      const sent = await container.resolve(Modules.NOTIFICATION).listNotifications({ template: "gift-card" })
      expect(sent.map((n) => [n.to, n.data?.code, n.data?.message])).toEqual([["friend@example.com", card.code, "Happy birthday"]])

      const { data: reg } = await api.post("/auth/customer/emailpass/register", { email: "friend@example.com", password: "password123" })
      await api.post("/store/customers", { email: "friend@example.com", first_name: "Ravi" }, { headers: { ...headers, authorization: `Bearer ${reg.token}` } })
      const { data: login } = await api.post("/auth/customer/emailpass", { email: "friend@example.com", password: "password123" })
      const auth = { authorization: `Bearer ${login.token}` }

      const claimed = await api.post("/store/customers/me/gift-cards", { code: card.code.toLowerCase() }, { headers: { ...headers, ...auth } })
      expect(claimed.data).toEqual({ claimed: true })
      const again = await api.post("/store/customers/me/gift-cards", { code: card.code }, { headers: { ...headers, ...auth } }).catch((e) => e.response)
      expect(again.status).toBeGreaterThanOrEqual(400)

      const { data: accounts } = await api.get("/store/store-credit-accounts?currency_code=inr", { headers: { ...headers, ...auth } })
      expect(Number(accounts.store_credit_accounts[0].balance)).toEqual(1000)

      const cartId = await giftCardCart(auth)
      const { data: credited } = await api.post(`/store/carts/${cartId}/store-credits`, {}, { headers: { ...headers, ...auth } })
      expect(Number(credited.cart.total)).toEqual(0)
      const { data: done } = await api.post(`/store/carts/${cartId}/complete`, {}, { headers: { ...headers, ...auth } })
      expect(done.type).toEqual("order")

      const { data: after } = await api.get("/store/store-credit-accounts?currency_code=inr", { headers: { ...headers, ...auth } })
      expect(Number(after.store_credit_accounts[0].balance)).toEqual(0)

      const { data: [issued] } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "gift_card", fields: ["id"], filters: { reference_id: done.order.id } })
      expect(issued).toBeDefined()
    })
  },
})
