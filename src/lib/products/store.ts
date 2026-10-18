import "server-only";
import { randomUUID } from "node:crypto";
import { MongoServerError, type ClientSession } from "mongodb";
import { getDatabase } from "../db/connection";
import { getCollection } from "../db/collections";
import { transaction, lockReadyMedia } from "../media/storage";
import { requireAdmin } from "../auth/admin";
import { RequestError } from "../admin/http";
import { productInputSchema, orderInputSchema, reviewInputSchema, publicReview, type ProductRecord, type ProductInput, type ProductAdmin, type OrderRecord, type ReviewRecord, type ProductView } from "./schema";
export async function products() { return (await getDatabase()).collection<ProductRecord>("products"); }
export async function orders() { return (await getDatabase()).collection<OrderRecord>("productOrders"); }
export async function reviews() { return (await getDatabase()).collection<ReviewRecord>("productReviews"); }
function admin(record:ProductRecord):ProductAdmin { return {id:record._id,updatedAt:record.updatedAt.toISOString(),data:productInputSchema.parse(recordFields(record))}; }
function recordFields({_id,createdAt,updatedAt,revision,...data}:ProductRecord) { void _id;void createdAt;void updatedAt;void revision;return data; }
async function lock(session:ClientSession) { await (await getDatabase()).collection<{_id:string;revision:number}>("contentLocks").updateOne({_id:"products"},{$inc:{revision:1}},{upsert:true,session}); }
export async function listAdminProducts() { await requireAdmin(); return (await (await products()).find().sort({displayOrder:1,_id:1}).limit(500).toArray()).map(admin); }
export async function saveProduct(id:string|null,input:ProductInput,expected?:string) {
 await requireAdmin(); const data=productInputSchema.parse(input);
 return transaction(async session=>{
  await lock(session);const collection=await products();const old=id?await collection.findOne({_id:id},{session}):null;
  if(id&&(!old||old.updatedAt.toISOString()!==expected))throw new RequestError("Product changed or was removed. Reload before editing.",409);
  const duplicate=await collection.findOne({slug:data.slug},{session});if(duplicate&&duplicate._id!==id)throw new RequestError("Slug is already used.",409);
  for(const [mediaId,kind] of [...data.images.map(i=>[i.mediaId,"image"] as const),...(data.videoId?[[data.videoId,"video"] as const]:[])]){
   if(!await lockReadyMedia(mediaId,session))throw new RequestError("Choose completed uploads that are not being deleted.",409);
   const media=await getCollection("media");if(!await media.findOne({_id:mediaId,kind},{session}))throw new RequestError("Media type does not match the selected field.");
   if(data.status==="published")await media.updateOne({_id:mediaId},{$set:{status:"published",updatedAt:new Date()}},{session});
  }
  const now=new Date(Math.max(Date.now(),(old?.updatedAt.getTime()??0)+1));
  const record:ProductRecord={...data,_id:id??randomUUID(),createdAt:old?.createdAt??now,updatedAt:now,revision:(old?.revision??0)+1};
  await collection.replaceOne({_id:record._id},record,{upsert:true,session});return admin(record);
 });
}
export async function deleteProduct(id:string,expected:string){await requireAdmin();await transaction(async session=>{await lock(session);const result=await(await products()).deleteOne({_id:id,updatedAt:new Date(expected)},{session});if(!result.deletedCount)throw new RequestError("Product changed or was removed. Reload first.",409);});}
export async function productView(record:ProductRecord):Promise<ProductView>{
 if(record.status!=="published")throw new RequestError("Product not found",404);
 const data=productInputSchema.parse(recordFields(record));
 const assets=await(await getCollection("media")).find({_id:{$in:[...data.images.map(i=>i.mediaId),data.videoId]},status:"published"}).toArray();
 return {...data,id:record._id,updatedAt:record.updatedAt.toISOString(),gallery:data.images.flatMap(i=>{const asset=assets.find(a=>a._id===i.mediaId&&a.kind==="image");return asset?[{url:asset.url,alt:i.alt}]:[];}),video:assets.find(a=>a._id===data.videoId&&a.kind==="video")?.url};
}
export async function publicProduct(slug:string){const record=await(await products()).findOne({slug,status:"published"});return record?productView(record):null;}
export async function listPublicProducts(search="",category="",page=1){
 const query={status:"published" as const,...(category?{category}:{}),...(search?{title:{$regex:search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),$options:"i"}}:{})};
 const collection=await products();const [records,count,categories]=await Promise.all([collection.find(query).sort({displayOrder:1,_id:1}).skip((page-1)*12).limit(12).toArray(),collection.countDocuments(query),collection.distinct("category",{status:"published"})]);
 return {items:await Promise.all(records.map(productView)),count,categories};
}
export async function approvedReviews(productId:string){const rows=await(await reviews()).find({productId,status:"approved"}).sort({createdAt:-1}).limit(50).toArray();return rows.filter(x=>x.status==="approved").map(publicReview);}
export async function saveSubmission(kind:"orders"|"reviews",productId:string,value:unknown,ticket:{id:string;expiresAt:Date}){
 const data=kind==="orders"?orderInputSchema.parse(value):reviewInputSchema.parse(value);const id=randomUUID();
 try{await transaction(async session=>{
  const product=await(await products()).findOne({_id:productId,status:"published"},{session});if(!product || product.status!=="published")throw new RequestError("Product is not available.",404);
  if(kind==="orders"&&product.availability==="unavailable")throw new RequestError("This product is not accepting orders.",409);
  // Serialize against edits/unpublish, so snapshots reflect the accepted product.
  await(await products()).updateOne({_id:productId},{$inc:{revision:1}},{session});
  await(await getDatabase()).collection<{_id:string;expiresAt:Date}>("contactReceipts").insertOne({_id:ticket.id,expiresAt:ticket.expiresAt},{session});
  const now=new Date();
  if(kind==="orders")await(await orders()).insertOne({...orderInputSchema.parse(data),_id:id,productId,productTitle:product.title,productSlug:product.slug,unitPrice:product.price,currency:product.currency,status:"new",createdAt:now,updatedAt:now},{session});
  else await(await reviews()).insertOne({...reviewInputSchema.parse(data),_id:id,productId,productTitle:product.title,status:"pending",createdAt:now,updatedAt:now},{session});
 });}catch(error){if(error instanceof MongoServerError&&error.code===11000)throw new RequestError("This request was already submitted. Do not submit it twice.",409);throw error;}return id;
}
