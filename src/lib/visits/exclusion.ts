import "server-only";
import {AdminAuthorizationError} from "../auth/policy";
import {isAutomatedVisit} from "./policy";
export async function excludeFromVisits(verifyAdmin:()=>Promise<unknown>,agent:string){
 try {await verifyAdmin();return true;}
 catch(error){if(!(error instanceof AdminAuthorizationError))throw error;}
 return isAutomatedVisit(agent);
}
