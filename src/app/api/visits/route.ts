import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/lib/auth/admin";
import {excludeFromVisits} from "@/lib/visits/exclusion";
import {publicContactContext,takeRate} from "@/lib/contact/protection";
import {apiError} from "@/lib/admin/http";
import {visitorCookieName,visitorIdentity} from "@/lib/visits/policy";
import {recordVisit,visitorTotal} from "@/lib/visits/store";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{
 const context=publicContactContext(request);
 // Identity comes exclusively from the verified server session, never request email/role.
 if(await excludeFromVisits(requireAdmin,request.headers.get('user-agent')||''))return NextResponse.json({total:await visitorTotal(),counted:false},{headers:{'Cache-Control':'no-store'}});
 await takeRate('visits-global','all',5000,900000,context.secret);
 if(context.ip)await takeRate('visits-ip',context.ip,120,3600000,context.secret);
 const identity=visitorIdentity(request.cookies.get(visitorCookieName)?.value,context.secret);
 const result=await recordVisit(identity.id,context.secret);
 const response=NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(visitorCookieName,identity.cookie,{httpOnly:true,secure:new URL(context.origin).protocol==='https:',sameSite:'lax',path:'/',maxAge:31536000});
 return response;
 }catch(error){return apiError(error);}}
