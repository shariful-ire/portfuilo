import { z } from "zod";
const text = z.string().trim().min(1).max(200);
export const productInputSchema = z.object({
 title: text, slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), summary: z.string().trim().min(1).max(500), description: z.string().trim().min(1).max(15000),
 category: text, price: z.number().int().min(0).max(100000000).nullable(), currency: z.enum(["BDT", "USD"]).default("BDT"),
 availability: z.enum(["available", "preorder", "unavailable"]), status: z.enum(["draft", "published"]), displayOrder: z.number().int().min(0).max(1000000),
 images: z.array(z.object({ mediaId: z.uuid(), alt: z.string().trim().min(1).max(500) }).strict()).min(1).max(15),
 videoId: z.union([z.literal(""), z.uuid()]),
 specifications: z.array(z.object({ name: text, value: z.string().trim().min(1).max(1000) }).strict()).max(50),
 features: z.array(z.string().trim().max(200)).max(30).transform(items=>items.filter(Boolean)), shipping: z.string().trim().max(3000), warranty: z.string().trim().max(3000), returns: z.string().trim().max(3000),
}).strict().refine(x=>new Set(x.images.map(i=>i.mediaId)).size===x.images.length,"Choose distinct gallery images");
export type ProductInput = z.infer<typeof productInputSchema>;
export const emptyProduct: ProductInput = { title:"", slug:"", summary:"", description:"", category:"", price:null,currency:"BDT",availability:"available",status:"draft",displayOrder:0,images:[],videoId:"",specifications:[],features:[],shipping:"",warranty:"",returns:"" };
export type ProductRecord = ProductInput & { _id: string; createdAt: Date; updatedAt: Date; revision: number };
export type ProductAdmin = { id: string; updatedAt: string; data: ProductInput };
export type ProductView = ProductInput & { id: string; updatedAt: string; gallery: {url:string;alt:string}[]; video?: string };
export const orderStates = ["new","contacted","confirmed","fulfilled","cancelled"] as const;
export const reviewStates = ["pending","approved","rejected"] as const;
export const orderInputSchema = z.object({ name:text, email:z.email().max(254), phone:z.string().trim().regex(/^\+?[0-9 ()-]{7,30}$/), address:z.string().trim().min(5).max(2000), quantity:z.number().int().min(1).max(20), message:z.string().trim().max(2000), consent:z.literal(true) }).strict();
export const reviewInputSchema = z.object({ name:z.string().trim().min(1).max(80), email:z.email().max(254), rating:z.number().int().min(1).max(5), message:z.string().trim().min(10).max(3000), consent:z.literal(true) }).strict();
export type OrderRecord = z.infer<typeof orderInputSchema> & { _id:string; productId:string; productTitle:string; productSlug:string; unitPrice:number|null; currency:string; status:typeof orderStates[number]; createdAt:Date; updatedAt:Date };
export type ReviewRecord = z.infer<typeof reviewInputSchema> & { _id:string; productId:string; productTitle:string; status:typeof reviewStates[number]; createdAt:Date; updatedAt:Date };
export function publicReview(review:ReviewRecord) { if(review.status!=="approved" || review.consent!==true)throw new Error("Review is private"); return {id:review._id,name:review.name,rating:review.rating,message:review.message,createdAt:review.createdAt.toISOString()}; }
export function priceLabel(price:number|null,currency:string) { return price === null ? "Contact for pricing" : new Intl.NumberFormat("en",{style:"currency",currency}).format(price/100); }
