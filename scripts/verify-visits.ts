import {loadEnvConfig} from '@next/env';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
loadEnvConfig(process.cwd());
async function main(){const name=`vc_${randomUUID().replaceAll('-','')}`;process.env.MONGODB_DB_NAME=name;const {getDatabase,closeDatabase}=await import('../src/lib/db/connection');try{const {recordVisit,visitorTotal}=await import('../src/lib/visits/store');const secret='test-only-counter-secret';const id=randomUUID(),now=new Date('2026-10-18T12:00:00Z');assert.equal(await visitorTotal(),0);const results=await Promise.all([recordVisit(id,secret,now),recordVisit(id,secret,now),recordVisit(id,secret,now)]);assert.equal(results.filter(r=>r.counted).length,1);assert.equal(await visitorTotal(),1);assert.equal((await recordVisit(id,secret,new Date('2026-10-19T12:00:00Z'))).total,2);assert.equal((await recordVisit(randomUUID(),secret,now)).total,3);await closeDatabase();assert.equal(await visitorTotal(),3);console.log('PASS: real MongoDB concurrent deduplication, next-day/new-browser counting, reconnect persistence.');}finally{if(!/^vc_[a-f0-9]{32}$/.test(name))throw new Error('Unsafe cleanup target');await(await getDatabase()).dropDatabase();await closeDatabase();console.log('Isolated visitor test database removed.');}}
main().catch(()=>{console.error('Visitor verification failed.');process.exitCode=1;});

