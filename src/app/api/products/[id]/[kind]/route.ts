import {getPresentation} from "@/lib/settings/pages";
import { z } from "zod";
import { readJson,RequestError } from "@/lib/admin/http";
import { publicContactContext,requestBudget,verifyToken,takeRate } from "@/lib/contact/protection";
import { contactError } from "@/lib/contact/http";
import { saveSubmission } from "@/lib/products/store";
import { orderInputSchema,reviewInputSchema } from "@/lib/products/schema";
export async function POST(request:Request,{params}:{params:Promise<{id:string;kind:string}>}){try{
 if(!(await getPresentation()).pages.find(p=>p.path==="/products")?.enabled)throw new RequestError("Products are unavailable.",404);
 const context=publicContactContext(request);await requestBudget(context,"submit");
 const {id,kind}=z.object({id:z.uuid(),kind:z.enum(["orders","reviews"])}).parse(await params);
 const body=z.object({token:z.string().max(200),website:z.string().max(200),data:z.unknown()}).strict().parse(await readJson(request,18000));
 if(body.website)throw new RequestError("Submission not accepted.");const data=(kind==="orders"?orderInputSchema:reviewInputSchema).parse(body.data);
 const ticket=verifyToken(body.token,context.secret);await takeRate(`product-${kind}`,data.email.toLowerCase(),3,3600000,context.secret);
 const reference=await saveSubmission(kind,id,data,ticket);
 return Response.json({saved:true,reference,message:kind==="orders"?"Order request saved. Payment and delivery will be discussed with you. No payment has been taken.":"Review saved for moderation. It will appear only after approval."},{status:201,headers:{"Cache-Control":"no-store"}});
 }catch(e){if(e instanceof z.ZodError)return Response.json({message:"Check the required fields, quantity or rating, and consent checkbox."},{status:400,headers:{"Cache-Control":"no-store"}});return contactError(e);}}
