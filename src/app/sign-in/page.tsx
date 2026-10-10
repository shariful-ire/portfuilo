import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminAuthorizationError } from "@/lib/auth/policy";
import { AuthConfigurationError } from "@/lib/auth/environment";
import { DatabaseConfigurationError } from "@/lib/db/connection";
import { AuthButton } from "@/components/auth/auth-buttons";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  let destination: string | undefined;
  let unavailable = "";
  try { await requireAdmin(); destination = "/dashboard"; }
  catch (error) {
    if (error instanceof AdminAuthorizationError) {
      if (error.code === "FORBIDDEN") destination = "/access-denied";
    } else unavailable = error instanceof AuthConfigurationError || error instanceof DatabaseConfigurationError ? "Admin sign-in is not configured yet. The site owner must configure Google OAuth, ADMIN_EMAIL, the auth secret, and MongoDB on the server." : "Authentication is temporarily unavailable. Please try again later.";
  }
  if (destination) redirect(destination);
  const query = await searchParams;
  return <PageContainer className="max-w-xl py-20"><Card><p className="mb-3 text-sm text-accent">Site administration</p><h1 className="text-3xl font-semibold">Sign in</h1><p className="my-6 leading-7 text-muted">Access is restricted to the site owner’s verified Google account.</p>{unavailable ? <><p role="status" className="leading-7 text-muted">{unavailable}</p><div className="mt-6 border-t border-border pt-6"><h2 className="font-semibold">Finish owner setup</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted"><li>Follow the Google OAuth setup in README.md and add the Google client ID and client secret to .env.local.</li><li>For localhost, register <code className="break-all text-accent">http://localhost:3000/api/auth/callback/google</code> as the Google redirect URI.</li><li>Restart the development server, then sign in with your configured admin Google account.</li></ol><p className="mt-5 text-sm leading-7 text-muted">After signing in, open Dashboard &rarr; Add / manage certificates or Add / manage projects. Configure Cloudinary to upload their images and PDFs.</p></div></> : <><AuthButton action="sign-in" />{query.error && <p role="alert" className="mt-5 text-sm text-red-300">Sign-in could not be completed. Please try again with the authorized Google account.</p>}</>}</Card></PageContainer>;
}
