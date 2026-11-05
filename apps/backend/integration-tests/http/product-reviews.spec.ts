import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"
import path from "node:path"

const pluginDir = path.dirname(require.resolve("@lambdacurry/medusa-product-reviews/package.json"))
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { updateProductReviewsWorkflow } = require(path.join(pluginDir, ".medusa/server/src/workflows/update-product-reviews.js"))

jest.setTimeout(120 * 1000)

medusaIntegrationTestRunner({
  testSuite: ({ api, getContainer }) => {
    let pk: string

    beforeEach(async () => {
      const { result } = await createApiKeysWorkflow(getContainer()).run({
        input: { api_keys: [{ title: "store", type: "publishable", created_by: "test" }] },
      })
      pk = result[0].token
    })

    const customer = async (email: string) => {
      const { data: reg } = await api.post("/auth/customer/emailpass/register", { email, password: "password123" })
      const { data } = await api.post("/store/customers", { email, first_name: "Asha", last_name: "Rao" }, { headers: { "x-publishable-api-key": pk, authorization: `Bearer ${reg.token}` } })
      const { data: login } = await api.post("/auth/customer/emailpass", { email, password: "password123" })
      return { id: data.customer.id as string, headers: { "x-publishable-api-key": pk, authorization: `Bearer ${login.token}` } }
    }

    const order = async (customerId: string, email: string) => {
      const o = await getContainer()
        .resolve(Modules.ORDER)
        .createOrders({ email, customer_id: customerId, currency_code: "inr", items: [{ title: "Tee", quantity: 1, unit_price: 999, product_id: "prod_tee" }] })
      const full = await getContainer().resolve(Modules.ORDER).retrieveOrder(o.id, { relations: ["items"] })
      return { id: o.id, lineId: full.items![0].id }
    }

    const review = (o: { id: string; lineId: string }) => ({ reviews: [{ order_id: o.id, order_line_item_id: o.lineId, rating: 4, content: "Soft and heavy.", images: [] }] })

    it("only lets the buyer post, keeps it hidden until approved", async () => {
      const asha = await customer("asha@example.com")
      const mallory = await customer("mallory@example.com")
      const o = await order(asha.id, "asha@example.com")

      const anon = await api.post("/store/product-reviews", review(o), { headers: { "x-publishable-api-key": pk } }).catch((e) => e.response)
      expect(anon.status).toEqual(401)

      const stranger = await api.post("/store/product-reviews", review(o), { headers: mallory.headers }).catch((e) => e.response)
      expect(stranger.status).toEqual(400)
      expect(stranger.data.message).toMatch(/your own orders/)

      const own = await api.post("/store/product-reviews", review(o), { headers: asha.headers })
      expect(own.status).toEqual(200)
      expect(own.data.product_reviews[0].status).toEqual("pending")
      const reviewId = own.data.product_reviews[0].id

      const sneaky = await api.get("/store/product-reviews?product_id=prod_tee&status=pending", { headers: { "x-publishable-api-key": pk } })
      expect(sneaky.data.product_reviews).toEqual([])

      const mine = await api.get("/store/customers/me/product-reviews", { headers: asha.headers })
      expect(mine.data.product_reviews.map((r: { id: string; status: string }) => [r.id, r.status])).toEqual([[reviewId, "pending"]])

      await updateProductReviewsWorkflow(getContainer()).run({ input: { productReviews: [{ id: reviewId, status: "approved" }] } })

      const listed = await api.get("/store/product-reviews?product_id=prod_tee", { headers: { "x-publishable-api-key": pk } })
      expect(listed.data.product_reviews.map((r: { id: string; name: string }) => [r.id, r.name])).toEqual([[reviewId, "Asha Rao"]])
      expect(listed.data.product_reviews[0].email).toBeUndefined()

      const stats = await api.get("/store/product-review-stats?product_id=prod_tee", { headers: { "x-publishable-api-key": pk } })
      expect(stats.data.product_review_stats[0]).toMatchObject({ review_count: 1, average_rating: 4 })
    })

    it("refuses anonymous, oversized and non-image photo uploads", async () => {
      const asha = await customer("asha@example.com")
      const form = (type: string, size: number) => {
        const f = new FormData()
        f.append("files", new Blob([new Uint8Array(size)], { type }), "photo")
        return f
      }

      const anon = await api.post("/store/product-reviews/uploads", form("image/png", 10), { headers: { "x-publishable-api-key": pk } }).catch((e) => e.response)
      expect(anon.status).toEqual(401)

      const huge = await api.post("/store/product-reviews/uploads", form("image/png", 21 * 1024 * 1024), { headers: asha.headers, maxBodyLength: Infinity }).catch((e) => e.response)
      expect(huge.status).toEqual(400)

      const text = await api.post("/store/product-reviews/uploads", form("text/html", 10), { headers: asha.headers }).catch((e) => e.response)
      expect(text.status).toEqual(400)

      const ok = await api.post("/store/product-reviews/uploads", form("image/png", 10), { headers: asha.headers })
      expect(ok.status).toEqual(200)
      expect(ok.data.files[0].url).toBeTruthy()
    })
  },
})
