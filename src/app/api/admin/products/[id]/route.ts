import { z } from "zod";
import { authorizeMutation,readJson,apiError } from "@/lib/admin/http";
import { saveProduct,deleteProduct } from "@/lib/products/store";
import { productInputSchema } from "@/lib/products/schema";
import { revalidatePath } from "next/cache";
type Context={params:Promise<{id:string}>};
export async function PUT(request:Request,{params}:Context){try{await authorizeMutation(request);const id=z.uuid().parse((await params).id);const body=z.object({data:productInputSchema,expected:z.iso.datetime()}).strict().parse(await readJson(request,100000));const result=await saveProduct(id,body.data,body.expected);revalidatePath("/products","layout");return Response.json(result);}catch(e){return apiError(e);}}
export async function DELETE(request:Request,{params}:Context){try{await authorizeMutation(request);const id=z.uuid().parse((await params).id);const body=z.object({expected:z.iso.datetime()}).strict().parse(await readJson(request));await deleteProduct(id,body.expected);revalidatePath("/products","layout");return Response.json({deleted:true});}catch(e){return apiError(e);}}
