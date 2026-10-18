import { SectionHeading } from "@/components/ui/section-heading";
import Link from "next/link";
import {getPresentation} from "@/lib/settings/pages";
import {listPublicProducts} from "@/lib/products/store";
import {ProductCard} from "./product-card";
export async function HomeProducts(){if(!(await getPresentation()).pages.find(p=>p.path==='/products')?.enabled)return null;let result;try{result=await listPublicProducts();}catch{return <section className="border-b border-border py-12"><h2 className="section-heading">Products</h2><p role="status" className="mt-4 text-muted">Products are temporarily unavailable.</p></section>;}if(!result.items.length)return null;return <section className="border-b border-border py-16 sm:py-24"><div className="mb-8 flex flex-col items-center gap-5"><SectionHeading label="Products" icon="products">Explore the collection.</SectionHeading><Link href="/products" className="text-accent">All products &rarr;</Link></div><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.items.slice(0,3).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>;}
