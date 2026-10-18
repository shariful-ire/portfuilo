import assert from "node:assert/strict";
import {test} from "node:test";
import {productInputSchema,emptyProduct,orderInputSchema,reviewInputSchema,publicReview,priceLabel,type ReviewRecord} from "../src/lib/products/schema";
import {uploadInputSchema,detectFileType,VIDEO_LIMIT} from "../src/lib/media/policy";
import {parsePublicRecord} from "../src/lib/db/public-read";
import {presentationDefaults,presentationSchema} from "../src/lib/settings/presentation";
const valid={...emptyProduct,title:'Fixture',slug:'fixture',summary:'Fixture summary',description:'Fixture only',category:'Hardware',images:[{mediaId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',alt:'Fixture image'}]};
test('products require bounded content, unique images, integer prices and safe slugs',()=>{
 assert.equal(productInputSchema.parse(valid).status,'draft');
 for(const patch of [{slug:'../admin'},{price:-1},{price:1.5},{images:[]},{images:[...valid.images,...valid.images]},{videoId:'https://evil.example/video'},{ADMIN_EMAIL:'spoof@example.com'},{status:'approved'}])assert.equal(productInputSchema.safeParse({...valid,...patch}).success,false);
 assert.equal(priceLabel(null,'BDT'),'Contact for pricing');
});
test('orders reject forged pricing, quantities, consent and admin status',()=>{
 const order={name:'Test',email:'test@example.com',phone:'+8801826663235',address:'Test address',quantity:1,message:'',consent:true};
 assert.equal(orderInputSchema.safeParse(order).success,true);
 for(const patch of [{quantity:0},{quantity:1.5},{quantity:21},{consent:false},{unitPrice:1},{status:'fulfilled'},{productTitle:'Spoof'}])assert.equal(orderInputSchema.safeParse({...order,...patch}).success,false);
 for(const name of ['productOrders','productReviews'])assert.throws(()=>parsePublicRecord(name as never,{}));
});
test('reviews require consent, moderation and remove private fields in public serialization',()=>{
 const input={name:'Reviewer',email:'private@example.com',rating:5,message:'Test-only review content.',consent:true};
 for(const patch of [{rating:6},{rating:0},{consent:false},{status:'approved'}])assert.equal(reviewInputSchema.safeParse({...input,...patch}).success,false);
 const review:ReviewRecord={...reviewInputSchema.parse(input),_id:'review',productId:'product',productTitle:'Fixture',status:'pending',createdAt:new Date(),updatedAt:new Date()};
 assert.throws(()=>publicReview(review));
 const output=publicReview({...review,status:'approved'});assert.ok(!JSON.stringify(output).includes(input.email));assert.ok(!('productId' in output));
});
test('MP4 uploads have a bounded size and file signature independent of browser MIME',()=>{
 const mp4=Buffer.from([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0]);
 assert.equal(detectFileType(mp4),'video/mp4');
 assert.equal(detectFileType(Buffer.from('fake video file text')),null);
 assert.equal(uploadInputSchema.safeParse({name:'demo.mp4',mime:'video/mp4',size:VIDEO_LIMIT,alt:'Product demonstration'}).success,true);
 assert.equal(uploadInputSchema.safeParse({name:'demo.mp4',mime:'video/mp4',size:VIDEO_LIMIT+1,alt:'Demo'}).success,false);
});
test('legacy navigation gains products without changing other owner settings',()=>{
 const old={...presentationDefaults,pages:presentationDefaults.pages.filter(p=>p.path!=='/products')};const result=presentationSchema.parse(old);
 assert.equal(result.pages.find(p=>p.path==='/products')?.enabled,true);assert.deepEqual(result.pages.filter(p=>p.path!=='/products'),old.pages);
});
