"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function AuthButton({ action }: { action: "sign-in" | "sign-out" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setBusy(true); setError("");
    try {
      const result = action === "sign-in" ? await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard", errorCallbackURL: "/sign-in?error=oauth" }) : await authClient.signOut();
      if (result.error) throw new Error("Authentication request failed");
      if (action === "sign-out") { router.replace("/sign-in"); router.refresh(); }
    } catch { setError(action === "sign-in" ? "Sign-in could not start. Please try again." : "Sign-out failed. Your session may still be active. Please try again."); }
    finally { setBusy(false); }
  }
  return <div><Button variant={action === "sign-out" ? "secondary" : "primary"} disabled={busy} onClick={run}>{busy ? "Please wait…" : action === "sign-in" ? "Continue with Google" : "Sign out"}</Button>{error && <p role="alert" className="mt-3 max-w-sm text-sm text-red-300">{error}</p>}</div>;
}
