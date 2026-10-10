import { publicMetadata } from "@/lib/seo/metadata";
import { PublicMotion } from "@/components/motion/public-motion";
import { FloatingContact } from "@/components/contact/floating-contact";
import { contactActions } from "@/lib/contact/links";
import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPublicSettings } from "@/lib/settings/public";
import "./globals.css";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getPublicSettings();
  const metadata = await publicMetadata("/");
  return { ...metadata, alternates: undefined, title: { default: data.siteTitle, template: `%s | ${data.name}` } };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data } = await getPublicSettings();
  return <html lang="en" data-scroll-behavior="smooth"><body className="flex min-h-dvh flex-col antialiased"><a href="#main-content" className="sr-only z-50 rounded-lg bg-accent p-4 text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a><PublicMotion /><Header shortName={data.shortName} /><main id="main-content" tabIndex={-1} className="flex-1">{children}</main><Footer /><FloatingContact actions={contactActions(data)} /></body></html>;
}
