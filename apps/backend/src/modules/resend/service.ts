import type { Logger, NotificationTypes } from "@medusajs/framework/types"
import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { Resend } from "resend"
import { render } from "./templates"

type Options = { apiKey: string; from: string; replyTo?: string }

class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend"

  protected client_: Resend
  protected options_: Options
  protected logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    if (!options.apiKey || !options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Resend needs `apiKey` and `from`")
    }
  }

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.client_ = new Resend(options.apiKey)
  }

  async send(notification: NotificationTypes.ProviderSendNotificationDTO): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const rendered = notification.content?.html
      ? { subject: notification.content.subject ?? "", html: notification.content.html, text: notification.content.text ?? undefined }
      : render(notification.template, notification.data ?? {})
    if (!rendered) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `No email template named "${notification.template}"`)
    }

    const { data, error } = await this.client_.emails.send({
      from: notification.from ?? this.options_.from,
      to: notification.to,
      subject: rendered.subject,
      html: rendered.html,
      ...(rendered.text ? { text: rendered.text } : {}),
      ...(this.options_.replyTo ? { replyTo: this.options_.replyTo } : {}),
      attachments: notification.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.content_type })),
    })
    if (error) {
      this.logger_.error(`Resend failed for template ${notification.template}: ${error.message}`)
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
    }
    return { id: data?.id }
  }
}

export default ResendNotificationService
