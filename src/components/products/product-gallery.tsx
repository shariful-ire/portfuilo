"use client";
import {useRef,useState} from "react";
import Image from "next/image";
import {Button} from "@/components/ui/button";
export function ProductGallery({images}:{images:{url:string;alt:string}[]}){
 const [index,setIndex]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const image=images[index];
 if(!image)return <p className="rounded-2xl border border-border p-8 text-muted">Product image unavailable.</p>;
 return <div className="space-y-4"><button type="button" aria-label="Open full-size product image" className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-border bg-surface" onClick={()=>dialog.current?.showModal()}><Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-4" priority/></button><div className="flex flex-wrap gap-3">{images.map((item,i)=><button key={item.url} type="button" aria-label={`Show image ${i+1}: ${item.alt}`} aria-pressed={i===index} className="relative size-16 overflow-hidden rounded-lg border border-border aria-pressed:border-accent" onClick={()=>setIndex(i)}><Image src={item.url} alt="" fill sizes="64px" className="object-cover"/></button>)}</div><dialog ref={dialog} className="m-auto w-[95vw] max-w-5xl rounded-2xl border border-border bg-background p-5 text-foreground backdrop:bg-black/80"><div className="mb-4 flex justify-between gap-3"><p>{image.alt}</p><Button onClick={()=>dialog.current?.close()}>Close</Button></div><div className="relative h-[70vh]"><Image src={image.url} alt={image.alt} fill sizes="95vw" className="object-contain"/></div></dialog></div>;
}
