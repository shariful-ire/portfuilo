"use client";
import { useId, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CertificateView } from "@/lib/certificates/schema";

export function CertificateCard({ certificate: c }: { certificate: CertificateView }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  return <Card className="flex h-full flex-col gap-4">
    {c.imageUrl && <Image sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) 45vw, 350px" src={c.imageUrl} alt={c.imageAlt || c.title} width={640} height={420} className="h-48 w-full rounded-lg bg-background object-contain" />}
    {c.category && <p className="text-xs font-medium text-accent">{c.category}</p>}
    <h3 className="text-xl font-semibold">{c.title}</h3><p className="text-sm text-muted">{c.issuer}{c.issuedOn && <> · <time dateTime={c.issuedOn}>{c.issuedOn}</time></>}</p>
    {c.description && <p className="whitespace-pre-line text-sm leading-7 text-muted">{c.description}</p>}
    {c.credentialId && <p className="break-words text-xs text-muted">Credential ID: {c.credentialId}</p>}
    <div className="mt-auto flex flex-wrap items-center gap-4">
      {c.imageUrl && <Button ref={trigger} variant="secondary" aria-label={`Preview ${c.title} full size`} onClick={() => dialog.current?.showModal()}>Full-size preview</Button>}
      {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent">Verify credential <span className="sr-only">(opens a new tab)</span></a>}
      {c.pdfUrl && <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent">View PDF <span className="sr-only">(opens a new tab)</span></a>}
    </div>
    {c.imageUrl && <dialog ref={dialog} aria-labelledby={titleId} onClose={() => trigger.current?.focus()} className="m-auto max-h-[90dvh] w-[min(96vw,100rem)] max-w-none overflow-auto rounded-xl border border-border bg-background p-5 text-foreground backdrop:bg-black/80">
      <div className="sticky top-0 mb-5 flex items-center justify-between gap-4 bg-background py-2"><h2 id={titleId} className="text-lg font-semibold">{c.title}</h2><Button onClick={() => dialog.current?.close()}>Close preview</Button></div>
      <Image sizes="(max-width: 767px) 90vw, 1100px" src={c.imageUrl} alt={c.imageAlt || c.title} width={1600} height={1200} className="h-auto w-full object-contain" />
      <a href={c.imageUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-accent">Open original image (new tab)</a>
    </dialog>}
  </Card>;
}
