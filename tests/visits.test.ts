import assert from "node:assert/strict";
import {test} from "node:test";
import {visitorIdentity,visitorCookie,visitReceipt,isAutomatedVisit} from "../src/lib/visits/policy";
import {publicVisitPath} from "../src/lib/visits/paths";
const secret='test-only-key-long-enough-for-visit-policy';
test('visitor identity is signed; forged and changed cookie values do not authenticate',()=>{const first=visitorIdentity(undefined,secret);assert.equal(first.fresh,true);assert.equal(visitorIdentity(first.cookie,secret).id,first.id);assert.equal(visitorIdentity(first.cookie+'x',secret).fresh,true);assert.equal(visitorIdentity(first.cookie,'different-key').fresh,true);assert.equal(visitorCookie(first.id,secret),first.cookie);});
test('visit receipts deduplicate the browser across routes/refreshes within a UTC day',()=>{const id=visitorIdentity(undefined,secret).id;const a=visitReceipt(id,secret,new Date('2026-10-18T00:00:00Z'));assert.equal(a.id,visitReceipt(id,secret,new Date('2026-10-18T23:59:59Z')).id);assert.notEqual(a.id,visitReceipt(id,secret,new Date('2026-10-19T00:00:00Z')).id);assert.ok(!a.id.includes(id));assert.equal(a.expiresAt,new Date('2026-10-21T00:00:00Z').getTime());});
test('only public portfolio paths initiate visits',()=>{for(const path of ['/','/products','/products/test-product','/posts/post','/about'])assert.equal(publicVisitPath(path),true);for(const path of ['/dashboard','/dashboard/products','/sign-in','/api/visits','/not-real'])assert.equal(publicVisitPath(path),false);});
test('common crawler and link-preview visits are ignored',()=>{assert.equal(isAutomatedVisit('Googlebot'),true);assert.equal(isAutomatedVisit('facebookexternalhit/1.1'),true);assert.equal(isAutomatedVisit('Mozilla/5.0'),false);});
import {excludeFromVisits} from "../src/lib/visits/exclusion";
import {AdminAuthorizationError} from "../src/lib/auth/policy";
test('verified admin is excluded; visitors count; uncertain auth failures never count',async()=>{
 assert.equal(await excludeFromVisits(async()=>({id:'admin'}),'Mozilla'),true);
 for(const code of ['UNAUTHENTICATED','FORBIDDEN'] as const) assert.equal(await excludeFromVisits(async()=>{throw new AdminAuthorizationError(code);},'Mozilla'),false);
 await assert.rejects(excludeFromVisits(async()=>{throw new Error('Auth service unavailable');},'Mozilla'));
});
