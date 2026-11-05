import type { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber } from "@medusajs/framework/utils"

/** Medusa stores major units; Indian gateways take paise. */
export function toPaise(amount: BigNumberInput): number {
  return Math.round(new BigNumber(amount).numeric * 100)
}

export function fromPaise(paise: number): number {
  return paise / 100
}
