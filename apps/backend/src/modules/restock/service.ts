import { MedusaService } from "@medusajs/framework/utils"
import RestockSubscription from "./models/restock-subscription"

export default class RestockModuleService extends MedusaService({ RestockSubscription }) {}
