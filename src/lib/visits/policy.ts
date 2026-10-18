import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";
export const visitorCookieName = "portfolio_visitor";
export function visitorCookie(id:string,secret:string){return `${id}.${createHmac('sha256',secret).update(`visitor-cookie:${id}`).digest('hex')}`;}
export function visitorIdentity(cookie:string|undefined,secret:string){
 const match=/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.([0-9a-f]{64})$/.exec(cookie??'');
 if(match){const expected=visitorCookie(match[1],secret).split('.')[1];if(timingSafeEqual(Buffer.from(match[2]),Buffer.from(expected)))return {id:match[1],cookie:cookie!,fresh:false};}
 const id=randomUUID();return {id,cookie:visitorCookie(id,secret),fresh:true};
}
export function visitReceipt(id:string,secret:string,now=new Date()){
 const day=now.toISOString().slice(0,10);
 return {id:createHmac('sha256',secret).update(`visit:${day}:${id}`).digest('hex'),expiresAt:new Date(`${day}T00:00:00.000Z`).getTime()+3*86400000};
}
export function isAutomatedVisit(agent:string){return /bot\b|crawler|spider|slurp|preview|facebookexternalhit/i.test(agent);}
