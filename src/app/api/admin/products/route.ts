import {productInputSchema} from "@/lib/products/schema";
import { authorizeMutation,readJson,apiError } from "@/lib/admin/http";
import { listAdminProducts,saveProduct } from "@/lib/products/store";
import { revalidatePath } from "next/cache";
export async function GET(){try{return Response.json(await listAdminProducts(),{headers:{"Cache-Control":"no-store"}});}catch(e){return apiError(e);}}
export async function POST(request:Request){try{await authorizeMutation(request);const result=await saveProduct(null,productInputSchema.parse(await readJson(request,100000)));revalidatePath("/products");return Response.json(result,{status:201});}catch(e){return apiError(e);}}
