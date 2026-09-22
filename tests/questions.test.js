import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, withContent } from '../lib/questions.js';

const validEdit=()=>questions.map(q=>({id:q.id,text:q.text,options:[...q.options],correct:q.correct,explanation:q.explanation}));

test('bundled Thai content stays readable and satisfies the admin content limits',()=>{
 assert.doesNotThrow(()=>withContent(validEdit()));
 for(const q of questions){
  assert.match(q.text,/[\u0E00-\u0E7F]/,'Thai question text must survive file encoding');
  assert.doesNotMatch(JSON.stringify(q),/\?{3}|\uFFFD/,'no encoding replacement characters');
 }
});

test('withContent(null) returns the default bank unedited',()=>{
 assert.deepEqual(withContent(null),questions);
});

test('office scenes survive an unchanged admin save but disappear when content changes',()=>{
 const unchanged=withContent(validEdit());
 assert.ok(unchanged[0].scene,'default scene is present');
 assert.deepEqual(unchanged[0].sourceSlides,[2,8]);
 for(const change of [{text:'โจทย์ใหม่'},{options:['ใหม่','สอง','สาม','สี่']},{correct:0},{explanation:'เหตุผลใหม่'}]){
  const edit=validEdit();edit[0]={...edit[0],...change};
  const result=withContent(edit);
  assert.equal(result[0].scene,undefined,'do not show stale scenario after editing');
  assert.equal(result[0].title,undefined);
  assert.equal(result[0].sourceSlides,undefined);
  assert.deepEqual(result[1],questions[1]);
 }
});
test('withContent applies wording edits but keeps id/round/points/seconds fixed to the template',()=>{
 const edit=validEdit();
 edit[0]={...edit[0],text:'คำถามแก้ไข',options:['ก','ข','ค','ง'],correct:2,explanation:'อธิบายแก้ไข',round:99,points:99999,seconds:1};
 const result=withContent(edit);
 assert.equal(result[0].text,'คำถามแก้ไข');assert.deepEqual(result[0].options,['ก','ข','ค','ง']);assert.equal(result[0].correct,2);assert.equal(result[0].explanation,'อธิบายแก้ไข');
 assert.equal(result[0].round,questions[0].round);assert.equal(result[0].points,questions[0].points);assert.equal(result[0].seconds,questions[0].seconds);
 assert.deepEqual(result.slice(1),questions.slice(1));
});
test('withContent trims whitespace on every editable field',()=>{
 const edit=validEdit();edit[3]={...edit[3],text:'  เว้นวรรค  ',options:['  a','b  ','c','d'],explanation:'  เหตุผล  '};
 const result=withContent(edit);
 assert.equal(result[3].text,'เว้นวรรค');assert.deepEqual(result[3].options,['a','b','c','d']);assert.equal(result[3].explanation,'เหตุผล');
});
test('withContent rejects the wrong number of questions',()=>{
 assert.throws(()=>withContent(validEdit().slice(0,9)));
 assert.throws(()=>withContent([...validEdit(),validEdit()[0]]));
});
test('withContent rejects duplicate or unknown ids',()=>{
 const dup=validEdit();dup[1]={...dup[1],id:dup[0].id};
 assert.throws(()=>withContent(dup));
 const unknown=validEdit();unknown[0]={...unknown[0],id:99};
 assert.throws(()=>withContent(unknown));
});
test('withContent rejects empty or oversized text, options and explanation',()=>{
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,text:''}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,text:'x'.repeat(281)}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,options:['a','b','c']}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,options:['','b','c','d']}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,explanation:''}:q)));
});
test('withContent rejects a correct index outside 0-3',()=>{
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,correct:4}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,correct:-1}:q)));
 assert.throws(()=>withContent(validEdit().map((q,i)=>i===0?{...q,correct:1.5}:q)));
});
