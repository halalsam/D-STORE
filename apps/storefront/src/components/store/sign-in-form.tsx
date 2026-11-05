"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Expand } from "@/components/ui/expand"
import { ArrowRight } from "@/components/ui/icons"
import { TextField } from "@/components/ui/text-field"
import { signIn, signUp } from "@/lib/data/customer"
import { startGoogleSignIn } from "@/lib/data/oauth"
import { syncBag } from "@/lib/stores/bag"
import { syncSaved } from "@/lib/stores/saved"
import { useShake } from "@/lib/use-shake"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.15em]">
      <path fill="#4285F4" d="M23.5 12.27c0-.8-.07-1.57-.2-2.31H12v4.37h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.68Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.87 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

/** Email first, then password (sign in) or name + password (create account). */
export function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/account"
  // Coming from the order confirmation: the account must use the checkout email so the order lands in it.
  const orderId = params.get("order") || undefined
  const orderEmail = orderId ? params.get("email") ?? "" : ""
  const emailLocked = EMAIL.test(orderEmail)
  const [mode, setMode] = useState<"signin" | "register">(params.get("register") === "1" ? "register" : "signin")
  const [email, setEmail] = useState(emailLocked ? orderEmail : "")
  const [stage, setStage] = useState<"email" | "password">(emailLocked ? "password" : "email")
  const [error, setError] = useState<string>()
  const [googleError, setGoogleError] = useState(params.get("error") === "google" ? "Google sign-in did not finish. Try again." : undefined)
  const [googlePending, startGoogle] = useTransition()
  const [shakeRef, shake] = useShake<HTMLDivElement>()
  const [pending, start] = useTransition()

  const fail = (msg: string) => {
    setError(msg)
    shake()
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (stage === "email") {
      if (!EMAIL.test(email)) return fail("Enter a valid email")
      setError(undefined)
      setStage("password")
      requestAnimationFrame(() => document.getElementById("password")?.focus())
      return
    }
    const f = new FormData(e.currentTarget)
    const password = String(f.get("password") ?? "")
    if (password.length < 8) return fail("Use at least 8 characters")
    start(async () => {
      const res =
        mode === "signin"
          ? await signIn(email, password, orderId)
          : await signUp({
              email,
              password,
              firstName: String(f.get("firstName") ?? "").trim(),
              lastName: String(f.get("lastName") ?? "").trim(),
              marketing: f.get("marketing") === "on",
              orderId,
            })
      if (!res.ok) {
        if (mode === "register" && /already exists/i.test(res.error)) setMode("signin")
        return fail(res.error)
      }
      await Promise.all([syncBag(true), syncSaved()])
      router.push(next)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="type-heading-md">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p className="mt-1 type-body-sm text-ink-muted">
        {orderId
          ? mode === "signin"
            ? "Sign in to add this order to your account."
            : "Save this order to an account to track it, and check out faster next time."
          : mode === "signin"
            ? "Sign in or create an account"
            : "Track orders, save addresses and check out faster."}
      </p>

      <div ref={shakeRef}>
        <TextField
          type="email"
          name="email"
          autoComplete="email"
          label="Email"
          hideLabel
          placeholder="Email"
          className="mt-6"
          value={email}
          readOnly={emailLocked}
          hint={emailLocked ? "The email from your order, so the order is saved to your account" : undefined}
          onChange={(e) => {
            setEmail(e.target.value)
            if (stage === "password") setStage("email")
          }}
          error={stage === "email" ? error : undefined}
          trailing={
            stage === "email" ? (
              <Button type="submit" variant="ghost" size="icon" aria-label="Continue">
                <ArrowRight strokeWidth={1.6} />
              </Button>
            ) : undefined
          }
        />

        <Expand open={stage === "password"}>
          <div className="grid gap-3 pt-3">
            <Expand open={mode === "register"}>
              <div className="grid grid-cols-2 gap-3 pb-0.5">
                <TextField name="firstName" label="First name" hideLabel placeholder="First name" autoComplete="given-name" />
                <TextField name="lastName" label="Last name" hideLabel placeholder="Last name" autoComplete="family-name" />
              </div>
            </Expand>
            <TextField
              id="password"
              type="password"
              name="password"
              label="Password"
              hideLabel
              placeholder={mode === "signin" ? "Password" : "Create a password (8+ characters)"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              error={stage === "password" ? error : undefined}
            />
            <Button type="submit" size="xl" block loading={pending}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </div>
        </Expand>
      </div>

      {GOOGLE_ENABLED && (
        <div className="mt-5">
          <div className="flex items-center gap-3 type-caption text-ink-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="xl"
            block
            loading={googlePending}
            className="mt-5 normal-case tracking-normal type-body"
            onClick={() =>
              startGoogle(async () => {
                const res = await startGoogleSignIn(next)
                if (res && !res.ok) setGoogleError(res.error)
              })
            }
          >
            <GoogleMark /> Continue with Google
          </Button>
          {googleError && <p className="mt-2 text-center type-caption text-danger">{googleError}</p>}
        </div>
      )}

      {mode === "register" && stage === "password" && (
        <Checkbox name="marketing" label="Email me with news and offers" defaultChecked className="mt-4" />
      )}

      <p className="mt-5 text-center type-body-sm text-ink-muted">
        {mode === "signin" ? "New to D-STORE? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "register" : "signin"))
            setError(undefined)
          }}
          className="pressable text-accent-ink underline underline-offset-2"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="mt-4 text-center type-caption text-ink-muted">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-ink underline underline-offset-2">Terms of service</Link>
      </p>
    </form>
  )
}
