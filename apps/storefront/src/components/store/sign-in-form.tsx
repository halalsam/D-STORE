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
import { syncBag } from "@/lib/stores/bag"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Email first, then password (sign in) or name + password (create account). */
export function SignInForm() {
  const router = useRouter()
  const next = useSearchParams().get("next") || "/account"
  const [mode, setMode] = useState<"signin" | "register">("signin")
  const [email, setEmail] = useState("")
  const [stage, setStage] = useState<"email" | "password">("email")
  const [error, setError] = useState<string>()
  const [shake, setShake] = useState(0)
  const [pending, start] = useTransition()

  const fail = (msg: string) => {
    setError(msg)
    setShake((n) => n + 1)
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
          ? await signIn(email, password)
          : await signUp({
              email,
              password,
              firstName: String(f.get("firstName") ?? "").trim(),
              lastName: String(f.get("lastName") ?? "").trim(),
              marketing: f.get("marketing") === "on",
            })
      if (!res.ok) return fail(res.error)
      await syncBag(true)
      router.push(next)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="type-heading-md">{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p className="mt-1 type-body-sm text-ink-muted">
        {mode === "signin" ? "Sign in or create an account" : "Track orders, save addresses and check out faster."}
      </p>

      <div key={shake} className={shake ? "animate-shake" : undefined}>
        <TextField
          type="email"
          name="email"
          autoComplete="email"
          label="Email"
          hideLabel
          placeholder="Email"
          className="mt-6"
          value={email}
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
