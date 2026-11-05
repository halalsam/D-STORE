import { model } from "@medusajs/framework/utils"

/** "Email me when this size is back". One row per email and variant; notified_at set once emailed. */
const RestockSubscription = model
  .define("restock_subscription", {
    id: model.id({ prefix: "rsub" }).primaryKey(),
    email: model.text(),
    variant_id: model.text(),
    product_id: model.text(),
    customer_id: model.text().nullable(),
    notified_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["email", "variant_id"], unique: true },
    { on: ["variant_id"], where: "notified_at IS NULL" },
  ])

export default RestockSubscription
