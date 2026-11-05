import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { RESTOCK_MODULE } from "../modules/restock"
import type RestockModuleService from "../modules/restock/service"

type Input = { email: string; variant_id: string; product_id: string; customer_id: string | null }
type Undo = { createdId?: string; rearmedId?: string; notifiedAt?: Date | null }

/** Creates the subscription, or re-arms one that was already notified. */
const upsertRestockSubscriptionStep = createStep(
  "upsert-restock-subscription",
  async (input: Input, { container }) => {
    const restock = container.resolve<RestockModuleService>(RESTOCK_MODULE)
    const [existing] = await restock.listRestockSubscriptions({ email: input.email, variant_id: input.variant_id })
    if (!existing) {
      const created = await restock.createRestockSubscriptions(input)
      return new StepResponse<string, Undo>(created.id, { createdId: created.id })
    }
    if (existing.notified_at) {
      await restock.updateRestockSubscriptions({ id: existing.id, notified_at: null })
      return new StepResponse<string, Undo>(existing.id, { rearmedId: existing.id, notifiedAt: existing.notified_at as Date | null })
    }
    return new StepResponse<string, Undo>(existing.id, {})
  },
  async (undo, { container }) => {
    if (!undo) {
      return
    }
    const restock = container.resolve<RestockModuleService>(RESTOCK_MODULE)
    if (undo.createdId) {
      await restock.deleteRestockSubscriptions(undo.createdId)
    }
    if (undo.rearmedId) {
      await restock.updateRestockSubscriptions({ id: undo.rearmedId, notified_at: undo.notifiedAt })
    }
  }
)

export const subscribeRestockWorkflow = createWorkflow("subscribe-restock", (input: Input) => {
  return new WorkflowResponse(upsertRestockSubscriptionStep(input))
})
