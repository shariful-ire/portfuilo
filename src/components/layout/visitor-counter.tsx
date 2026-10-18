"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {publicVisitPath} from "@/lib/visits/paths";
let pending:Promise<number>|undefined;
function load(){if(!pending)pending=fetch('/api/visits',{method:'POST',cache:'no-store'}).then(async response=>{const result=await response.json();if(!response.ok||!Number.isSafeInteger(result.total)||result.total<0)throw new Error('Count unavailable');return result.total as number;}).catch(error=>{pending=undefined;throw error;});return pending;}
export function VisitorCounter(){
 const path=usePathname();const visible=publicVisitPath(path);
 const [total,setTotal]=useState<number|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{if(!visible)return;let active=true;load().then(value=>{if(active){setTotal(value);setFailed(false);}}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[visible]);
 if(!visible)return null;
 return <section aria-label="Portfolio visits" className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background/60 p-5 sm:p-6"><div><p className="font-mono text-xs uppercase tracking-widest text-accent">Portfolio visits</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted">One visit per browser per UTC day. Signed-in admin visits are excluded.</p></div><p role="status" className="text-2xl font-semibold tabular-nums">{failed?<span className="text-sm text-muted">Count temporarily unavailable</span>:total===null?<span className="text-sm text-muted">Loading count...</span>:new Intl.NumberFormat('en').format(total)}</p></section>;
}
