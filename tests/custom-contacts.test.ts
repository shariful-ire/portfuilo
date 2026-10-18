import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contactLinkUrl, customContactLinksJsonSchema } from '../src/lib/contact/custom-links';
import { contactActions } from '../src/lib/contact/links';
import { settingsInputSchema, settingsDefaults } from '../src/lib/settings/schema';
import { profileSchema } from '../src/lib/content/models';
test('custom contact URLs normalize missing scheme and reject executable or credential-bearing links',()=>{
 assert.equal(contactLinkUrl.parse('www.facebook.com/shariful.ire'),'https://www.facebook.com/shariful.ire');
 for(const link of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:secret@example.com','https://example.com\\evil','https://example.com/ bad','file:///etc/passwd']) assert.equal(contactLinkUrl.safeParse(link).success,false);
});
test('custom contacts validate titles and counts and render beside existing channels',()=>{
 const contacts=[{title:'Facebook',url:'www.facebook.com/shariful.ire'}];
 const parsed=settingsInputSchema.parse({...settingsDefaults,customContactsJson:JSON.stringify(contacts)});
 assert.equal(contactActions(parsed).find(x=>x.label==='Facebook')?.href,'https://www.facebook.com/shariful.ire');
 assert.equal(customContactLinksJsonSchema.safeParse('[{"title":"","url":"https://example.com"}]').success,false);
 assert.equal(customContactLinksJsonSchema.safeParse(JSON.stringify(Array(31).fill(contacts[0]))).success,false);
 assert.equal(contactActions({customContactsJson:'invalid'}).length,0);
 const saved=profileSchema.parse({_id:'11111111-1111-4111-8111-111111111111',createdAt:new Date(),updatedAt:new Date(),key:'owner',name:'Owner',shortName:'Owner',introduction:'Hello',customContacts:JSON.parse(parsed.customContactsJson)});
 assert.equal(saved.customContacts[0].title,'Facebook');
 assert.equal(contactActions({customContactsJson:'[]'}).length,0);
});
