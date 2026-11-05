import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"
import { createVerificationToken } from "../../src/lib/guest-orders"
import linkGuestOrder from "../../src/subscribers/link-guest-order"

jest.setTimeout(120 * 1000)

const EMAIL = "shopper@example.com"

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let pk: string

    beforeEach(async () => {
      const { result } = await createApiKeysWorkflow(getContainer()).run({
        input: { api_keys: [{ title: "store", type: "publishable", created_by: "test" }] },
      })
      pk = result[0].token
    })

    const guestOrder = async (email = EMAIL) => {
      const container = getContainer()
      const customers = container.resolve(Modules.CUSTOMER)
      const [existing] = await customers.listCustomers({ email, has_account: false })
      const guest = existing ?? (await customers.createCustomers({ email }))
      const order = await container.resolve(Modules.ORDER).createOrders({
        email,
        customer_id: guest.id,
        currency_code: "inr",
        items: [{ title: "Tee", quantity: 1, unit_price: 999 }],
      })
      return order.id
    }

    const register = async (email = EMAIL) => {
      const headers = { "x-publishable-api-key": pk }
      const { data: reg } = await api.post("/auth/customer/emailpass/register", { email, password: "password123" })
      await api.post("/store/customers", { email, first_name: "Asha", metadata: { email_verified_at: "spoofed" } }, { headers: { ...headers, authorization: `Bearer ${reg.token}` } })
      const { data: login } = await api.post("/auth/customer/emailpass", { email, password: "password123" })
      return { ...headers, authorization: `Bearer ${login.token}` }
    }

    const myOrderIds = async (headers: Record<string, string>) => {
      const { data } = await api.get("/store/orders", { headers })
      return data.orders.map((o: { id: string }) => o.id).sort()
    }

    it("links only the given order until the email is verified, then every guest order", async () => {
      const first = await guestOrder()
      const second = await guestOrder()
      await guestOrder("someone-else@example.com")
      const headers = await register()

      const me = await api.get("/store/customers/me", { headers })
      expect(me.data.customer.metadata?.email_verified_at).toBeUndefined()

      const none = await api.post("/store/customers/me/guest-orders", {}, { headers })
      expect(none.data).toEqual({ verified: false, linked: 0 })
      expect(await myOrderIds(headers)).toEqual([])

      const claimed = await api.post("/store/customers/me/guest-orders", { order_id: first }, { headers })
      expect(claimed.data).toEqual({ verified: false, linked: 1 })
      expect(await myOrderIds(headers)).toEqual([first])

      const spoof = await api.post("/store/customers/me", { metadata: { email_verified_at: "spoofed" } }, { headers })
      expect(spoof.data.customer.metadata?.email_verified_at).toBeUndefined()

      const token = createVerificationToken({ id: me.data.customer.id, email: EMAIL })
      const verified = await api.post("/store/email-verification", { token }, { headers: { "x-publishable-api-key": pk } })
      expect(verified.data).toEqual({ verified: true, linked: 1 })
      expect(await myOrderIds(headers)).toEqual([first, second].sort())

      const bad = await api.post("/store/email-verification", { token: `${token}x` }, { headers: { "x-publishable-api-key": pk } }).catch((e) => e.response)
      expect(bad.status).toEqual(400)
    })

    it("moves a new guest order into an existing verified account", async () => {
      const headers = await register()
      const me = await api.get("/store/customers/me", { headers })
      await api.post("/store/email-verification", { token: createVerificationToken({ id: me.data.customer.id, email: EMAIL }) }, { headers: { "x-publishable-api-key": pk } })

      const orderId = await guestOrder()
      await linkGuestOrder({ event: { name: "order.placed", data: { id: orderId } }, container: getContainer() } as never)
      expect(await myOrderIds(headers)).toEqual([orderId])

      const { data } = await api.get(`/store/orders/${orderId}?fields=%2Bcustomer_id`, { headers })
      expect(data.order.customer_id).toEqual(me.data.customer.id)
    })

    it("never takes an order from another account", async () => {
      const ownerHeaders = await register("owner@example.com")
      const owner = await api.get("/store/customers/me", { headers: ownerHeaders })
      const order = await getContainer()
        .resolve(Modules.ORDER)
        .createOrders({ email: EMAIL, customer_id: owner.data.customer.id, currency_code: "inr", items: [{ title: "Tee", quantity: 1, unit_price: 999 }] })

      const headers = await register()
      const res = await api.post("/store/customers/me/guest-orders", { order_id: order.id }, { headers })
      expect(res.data.linked).toEqual(0)
      expect(await myOrderIds(ownerHeaders)).toEqual([order.id])
    })
  },
})
