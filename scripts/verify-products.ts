import {loadEnvConfig} from '@next/env';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
loadEnvConfig(process.cwd());
let stage="connect";
async function main(){
 const name=`pc_${randomUUID().replaceAll('-','')}`;process.env.MONGODB_DB_NAME=name;
 const {getMongoClient,getDatabase}=await import('../src/lib/db/connection');
 const client=await getMongoClient();const db=await getDatabase(); console.log("Connected to isolated database");
 try{
  stage='import product store';
  const {products,orders,reviews,publicProduct,listPublicProducts,approvedReviews,saveSubmission}=await import('../src/lib/products/store');
  const {emptyProduct}=await import('../src/lib/products/schema');
  const productId=randomUUID(),imageId=randomUUID(),now=new Date();
  const fixture={...emptyProduct,_id:productId,title:'Isolated fixture',slug:'isolated-fixture',summary:'Test only',description:'Test fixture, never owner content',category:'Fixture',price:25000,images:[{mediaId:imageId,alt:'Fixture'}],createdAt:now,updatedAt:now,revision:0};
  stage="insert fixture";await(await products()).insertOne(fixture);
  await db.collection<{_id:string;status:string;kind:string;url:string}>('media').insertOne({_id:imageId,status:'published',kind:'image',url:'https://res.cloudinary.com/fixture/image/upload/example.png'});
  assert.equal(await publicProduct(fixture.slug),null);assert.equal((await listPublicProducts()).count,0);
  const input={name:'Test buyer',email:'private@example.com',phone:'+8801826663235',address:'Private fixture address',quantity:2,message:'Test note',consent:true};
  const ticket=()=>({id:randomUUID(),expiresAt:new Date(Date.now()+3600000)});
  await assert.rejects(saveSubmission('orders',productId,input,ticket()));
  await(await products()).updateOne({_id:productId},{$set:{status:'published'}});
  assert.equal((await publicProduct(fixture.slug))?.gallery.length,1);
  const receipt=ticket();const reference=await saveSubmission('orders',productId,input,receipt);assert.equal((await(await orders()).findOne({_id:reference}))?.unitPrice,25000);
  await assert.rejects(saveSubmission('orders',productId,input,receipt));assert.equal(await(await orders()).countDocuments(),1);
  await(await products()).updateOne({_id:productId},{$set:{price:99900,title:'Changed product'}});
  const saved=await(await orders()).findOne({_id:reference});assert.equal(saved?.unitPrice,25000);assert.equal(saved?.productTitle,'Isolated fixture');
  const review=await saveSubmission('reviews',productId,{name:'Reviewer',email:'hidden@example.com',rating:4,message:'Isolated test review.',consent:true},ticket());
  assert.equal((await approvedReviews(productId)).length,0);
  await(await reviews()).updateOne({_id:review},{$set:{status:'approved'}});
  const visible=await approvedReviews(productId);assert.equal(visible.length,1);assert.ok(!JSON.stringify(visible).includes('hidden@example.com'));
  await(await products()).updateOne({_id:productId},{$set:{availability:'unavailable'}});await assert.rejects(saveSubmission('orders',productId,input,ticket()));
  await(await products()).updateOne({_id:productId},{$set:{status:'draft'}});assert.equal(await publicProduct(fixture.slug),null);
  assert.equal(await(await orders()).countDocuments(),1);assert.equal(await db.collection('contactReceipts').countDocuments(),2);
  console.log('PASS: published/draft visibility, media resolution, real order save/replay, immutable price/title snapshots, unavailable rejection, review moderation/privacy.');
 }finally{if(!/^pc_[a-f0-9]{32}$/.test(name))throw new Error('Unsafe cleanup target');await client.db(name).dropDatabase();await client.close();console.log('Isolated product test database removed.');}
}
main().catch(error=>{console.error('Product verification failed at '+stage+' ('+error.name+').');if(error.name==='AssertionError')console.error(error.message);process.exit(1);});
