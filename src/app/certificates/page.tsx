import { publicMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { AdminToolbar } from "@/components/auth/admin-toolbar";
import { getPublicCertificates } from "@/lib/certificates/public";
import { buttonStyles } from "@/components/ui/button";
import { fieldStyles } from "@/components/ui/input";
export async function generateMetadata() { return publicMetadata("/certificates", "Certificates", "Published certificates and documented learning by Md. Shariful Islam."); }
export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category.trim().slice(0, 100) : "";
  const page = /^\d+$/.test(params.page ?? "") ? Math.min(1000, Math.max(1, Number(params.page))) : 1;
  let result;
  try { result = await getPublicCertificates({ category, page }); } catch { /* Do not pretend a database failure is an empty collection. */ }
  const href = (next: number) => `/certificates?${new URLSearchParams({ ...(category ? { category } : {}), page: String(next) })}`;
  return <><AdminToolbar /><PageContainer className="py-16"><h1 className="text-4xl font-semibold">Certificates</h1><p className="mt-4 text-muted">Explore documented learning and certifications.</p>
    {!result ? <p role="status" className="mt-8 text-muted">Certificates are temporarily unavailable. Please try again later.</p> : <>
      <form action="/certificates" method="get" className="my-8 flex flex-wrap items-end gap-4"><div><label htmlFor="category" className="mb-2 block text-sm">Category</label><select id="category" name="category" defaultValue={category} className={fieldStyles}><option value="">All categories</option>{category && !result.categories.includes(category) && <option value={category}>{category}</option>}{result.categories.map((name) => <option key={name} value={name}>{name}</option>)}</select></div><button className={buttonStyles()} type="submit">Filter certificates</button></form>
      {result.items.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <CertificateCard key={item.id} certificate={item} />)}</div> : <p className="rounded-xl border border-border p-8 text-muted">{category || page > 1 ? "No published certificates match this selection." : "No certificates published yet."}</p>}
      <nav aria-label="Certificate pages" className="mt-8 flex gap-6">{page > 1 && <Link className="text-accent" href={href(page - 1)}>Previous page</Link>}{page * result.limit < result.total && page < 1000 && <Link className="text-accent" href={href(page + 1)}>Next page</Link>}</nav>
    </>}
  </PageContainer></>;
}
