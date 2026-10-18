import "server-only";
import {MongoServerError} from "mongodb";
import {getDatabase} from "../db/connection";
import {transaction} from "../media/storage";
import {visitReceipt} from "./policy";
export async function visitorTotal(){const row=await(await getDatabase()).collection<{_id:string;total:number}>("siteMetrics").findOne({_id:"visits"});return row?.total??0;}
export async function recordVisit(id:string,secret:string,now=new Date()){
 const receipt=visitReceipt(id,secret,now);let counted=false;
 try{await transaction(async session=>{
  const db=await getDatabase();
  await db.collection<{_id:string;expiresAt:Date}>("visitReceipts").insertOne({_id:receipt.id,expiresAt:new Date(receipt.expiresAt)},{session});
  await db.collection<{_id:string;total:number;updatedAt:Date;startedAt:Date}>("siteMetrics").updateOne({_id:"visits"},{$inc:{total:1},$set:{updatedAt:now},$setOnInsert:{startedAt:now}},{upsert:true,session});
 });counted=true;}catch(error){if(!(error instanceof MongoServerError&&error.code===11000))throw error;}
 return {total:await visitorTotal(),counted};
}
