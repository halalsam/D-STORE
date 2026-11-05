import type { OrderChangeDTO } from "@medusajs/framework/types"
import { ChangeActionType, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createOrderChangeActionsWorkflow, createOrderChangeStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"

type Input = { order_id: string; customer_id: string }

type OrderRow = { id: string; email: string | null; customer_id: string | null; customer: { has_account: boolean } | null }
type CustomerRow = { id: string; email: string; has_account: boolean }

const sameEmail = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase()

const validateLinkOrderToCustomerStep = createStep("validate-link-order-to-customer", async ({ order, customer }: { order: OrderRow; customer: CustomerRow }) => {
  if (!customer.has_account) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Customer ${customer.id} has no account`)
  }
  if (order.customer_id === customer.id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, `Order ${order.id} already belongs to customer ${customer.id}`)
  }
  // Never take an order away from another registered account.
  if (order.customer?.has_account) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Order ${order.id} belongs to another account`)
  }
  if (!sameEmail(order.email, customer.email)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, `Order ${order.id} was placed with a different email`)
  }
})

const confirmLinkOrderChangeStep = createStep(
  "confirm-link-order-change",
  async ({ change, orderId }: { change: OrderChangeDTO; orderId: string }, { container }) => {
    const orderModule = container.resolve(Modules.ORDER)
    await orderModule.confirmOrderChange({ id: change.id })
    return new StepResponse(undefined, { orderId, change: { id: change.id, order_id: orderId, status: change.status } })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    await container.resolve(Modules.ORDER).undoLastChange(compensation.orderId, compensation.change)
  }
)

/**
 * Moves a guest order to the registered account with the same email, as an
 * order change so the transfer shows in the admin order timeline.
 */
export const linkOrderToCustomerWorkflow = createWorkflow("link-order-to-customer", (input: Input) => {
  const { data: order } = useQueryGraphStep({
    entity: "order",
    fields: ["id", "email", "customer_id", "customer.has_account"],
    filters: { id: input.order_id },
    options: { throwIfKeyNotFound: true, isList: false },
  }).config({ name: "link-order-query" })

  const { data: customer } = useQueryGraphStep({
    entity: "customer",
    fields: ["id", "email", "has_account"],
    filters: { id: input.customer_id },
    options: { throwIfKeyNotFound: true, isList: false },
  }).config({ name: "link-customer-query" })

  validateLinkOrderToCustomerStep({ order: order as unknown as OrderRow, customer: customer as unknown as CustomerRow })

  const change = createOrderChangeStep({ change_type: "transfer", order_id: input.order_id, description: "Linked guest order to customer account" })

  const actions = transform({ input, order, change }, ({ input, order, change }) => [
    {
      order_change_id: change.id,
      order_id: input.order_id,
      version: change.version,
      action: ChangeActionType.TRANSFER_CUSTOMER,
      reference: "customer",
      reference_id: input.customer_id,
      details: { original_customer_id: (order as unknown as OrderRow).customer_id },
    },
  ])
  createOrderChangeActionsWorkflow.runAsStep({ input: actions })

  confirmLinkOrderChangeStep({ change, orderId: input.order_id })

  return new WorkflowResponse({ order_id: input.order_id, customer_id: input.customer_id })
})
