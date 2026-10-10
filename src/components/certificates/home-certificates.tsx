import Link from "next/link";
import { getPublicCertificates } from "@/lib/certificates/public";
import { CertificateCard } from "./certificate-card";
export async function HomeCertificates() {
  let result;
  try { result = await getPublicCertificates({ limit: 3 }); } catch { /* Render an honest unavailable state below. */ }
  return <section id="certificates" aria-labelledby="certificates-title" className="border-b border-border py-16 sm:py-20"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">03 / Certificates</p><h2 id="certificates-title" className="text-3xl font-semibold tracking-tight">Certificates</h2><p className="mt-3 text-muted">Documented learning and certifications.</p>
    {!result ? <p role="status" className="mt-8 text-muted">Certificates are temporarily unavailable. Please try again later.</p> : result.items.length ? <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <CertificateCard key={item.id} certificate={item} />)}</div> : <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-muted">No certificates published yet.</p>}
    <Link href="/certificates" className="mt-8 inline-block text-accent">View all certificates →</Link></section>;
}
