import { z } from "zod";
import { authorizeMutation,readJson,apiError,RequestError } from "@/lib/admin/http";
import { orders,reviews } from "@/lib/products/store";
import { orderStates,reviewStates } from "@/lib/products/schema";
import { revalidatePath } from "next/cache";
type Context={params:Promise<{id:string;kind:string}>};
async function mutate(request:Request,context:Context,remove:boolean){try{await authorizeMutation(request);const {id,kind}=z.object({id:z.uuid(),kind:z.enum(["orders","reviews"])}).parse(await context.params);const body=z.object({expected:z.iso.datetime(),status:z.string().optional()}).strict().parse(await readJson(request));const filter={_id:id,updatedAt:new Date(body.expected)};
 if(remove){const result=kind==="orders"?await(await orders()).deleteOne(filter):await(await reviews()).deleteOne(filter);if(!result.deletedCount)throw new RequestError("Record changed. Reload first.",409);}
 else {const now=new Date(Math.max(Date.now(),new Date(body.expected).getTime()+1));const result=kind==="orders"?await(await orders()).updateOne(filter,{$set:{status:z.enum(orderStates).parse(body.status),updatedAt:now}}):await(await reviews()).updateOne(filter,{$set:{status:z.enum(reviewStates).parse(body.status),updatedAt:now}});if(!result.matchedCount)throw new RequestError("Record changed. Reload first.",409);}
 revalidatePath("/products","layout");revalidatePath(`/dashboard/${kind}`);return Response.json({saved:true});}catch(e){return apiError(e);}}
export async function PATCH(r:Request,c:Context){return mutate(r,c,false);}
export async function DELETE(r:Request,c:Context){return mutate(r,c,true);}
