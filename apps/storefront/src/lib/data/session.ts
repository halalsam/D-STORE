import "server-only"
import { cache } from "react"
import { getSession } from "./customer"

/** Per-request memoised session, so layout and page share one lookup. */
export const currentSession = cache(getSession)
