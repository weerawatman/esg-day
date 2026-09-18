import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomStore, createQuestionBankStore } from '../lib/store.js';
import { questions } from '../lib/questions.js';

// A minimal stand-in for @supabase/supabase-js's query builder, covering only the
// chain shapes lib/store.js actually calls, so the optimistic-concurrency retry logic
// can be exercised without a live database.
function fakeClient({rooms = {}, questionBank = null, onUpdateAttempt} = {}) {
 return {
  rooms,
  from(table) {
   if (table === 'rooms') return {
    select: () => ({eq: (col, code) => ({
     maybeSingle: async () => {
      const row = rooms[code];
      // structuredClone mimics a real PostgREST response: a fresh deserialized object,
      // never aliased to server-side storage (aliasing here would hide real bugs by
      // making in-place mutations "free" instead of requiring a write-back).
      return {data: row ? {data: structuredClone(row.data), version: row.version} : null, error: null};
     },
    })}),
    insert: async ({code, data, version}) => {
     if (rooms[code]) return {error: {code: '23505', message: 'duplicate key'}};
     rooms[code] = {data, version};
     return {error: null};
    },
    update: (patch) => ({eq: (col1, code) => ({eq: (col2, expectedVersion) => ({
     select: async () => {
      onUpdateAttempt?.(code, expectedVersion);
      const row = rooms[code];
      if (!row || row.version !== expectedVersion) return {data: [], error: null};
      rooms[code] = {data: patch.data, version: patch.version};
      return {data: [{version: patch.version}], error: null};
     },
    })})}),
   };
   if (table === 'question_bank') return {
    select: () => ({eq: () => ({
     maybeSingle: async () => ({data: questionBank ? {data: questionBank} : null, error: null}),
    })}),
    upsert: async ({data}) => {questionBank = data; return {error: null}},
   };
  },
 };
}

test('loadRoom/insertRoom: missing room is null, duplicate code is rejected',async()=>{
 const client=fakeClient();
 const store=createRoomStore(client);
 assert.equal(await store.loadRoom('111111'),null);
 await store.insertRoom('111111',{phase:'lobby'});
 assert.deepEqual(await store.loadRoom('111111'),{data:{phase:'lobby'},version:0});
 await assert.rejects(()=>store.insertRoom('111111',{phase:'lobby'}));
});
test('withRoom throws a Thai not-found error for an unknown room and never calls the mutator',async()=>{
 const store=createRoomStore(fakeClient());
 let called=false;
 await assert.rejects(()=>store.withRoom('999999',()=>{called=true}),/ไม่พบห้องนี้/);
 assert.equal(called,false);
});
test('withRoom skips the write entirely when the mutator makes no change',async()=>{
 let attempts=0;
 const client=fakeClient({rooms:{'111111':{data:{score:1},version:0}},onUpdateAttempt:()=>attempts++});
 const store=createRoomStore(client);
 const result=await store.withRoom('111111',rooms=>rooms['111111'].score);
 assert.equal(result,1);assert.equal(attempts,0);
 assert.deepEqual(client.rooms['111111'],{data:{score:1},version:0},'row must be untouched');
});
test('withRoom persists a change on the first attempt when nobody else is writing',async()=>{
 const client=fakeClient({rooms:{'111111':{data:{score:1},version:0}}});
 const store=createRoomStore(client);
 const result=await store.withRoom('111111',rooms=>{rooms['111111'].score=2;return 'done'});
 assert.equal(result,'done');
 assert.deepEqual(client.rooms['111111'],{data:{score:2},version:1});
});
test('withRoom calls the optional sync hook after a real save, but never when nothing changed',async()=>{
 const client=fakeClient({rooms:{'111111':{data:{score:1},version:0}}});
 const calls=[];
 const store=createRoomStore(client,{sync:async(code,data)=>calls.push([code,data])});
 await store.withRoom('111111',rooms=>rooms['111111'].score);
 assert.deepEqual(calls,[],'no write happened, so reporting has nothing new to mirror');
 await store.withRoom('111111',rooms=>{rooms['111111'].score=9});
 assert.equal(calls.length,1);assert.equal(calls[0][0],'111111');assert.deepEqual(calls[0][1],{score:9});
});
test('withRoom swallows a sync failure instead of failing the caller\'s request',async()=>{
 const client=fakeClient({rooms:{'111111':{data:{score:1},version:0}}});
 const store=createRoomStore(client,{sync:async()=>{throw new Error('reporting db down')}});
 const result=await store.withRoom('111111',rooms=>{rooms['111111'].score=2;return 'ok'});
 assert.equal(result,'ok');
});
test('withRoom transparently retries past one concurrent writer stealing the version first',async()=>{
 const rooms={'111111':{data:{score:1},version:0}};
 let sabotaged=false;
 const client=fakeClient({rooms,onUpdateAttempt:()=>{
  if(!sabotaged){sabotaged=true;rooms['111111']={data:{score:1,intruder:true},version:1}}
 }});
 const store=createRoomStore(client,{delay:()=>0});
 let mutateCalls=0;
 const result=await store.withRoom('111111',rooms=>{mutateCalls++;rooms['111111'].score=99;return 'ok'});
 assert.equal(result,'ok');assert.equal(mutateCalls,2,'must recompute against the freshly-read row after a conflict');
 assert.deepEqual(client.rooms['111111'].data,{score:99,intruder:true});
});
test('withRoom gives up with a Thai "try again" error once retries are exhausted under constant contention',async()=>{
 const client=fakeClient({rooms:{'111111':{data:{score:1},version:0}},onUpdateAttempt:(code,expected)=>{
  // every attempt sees its own version already stolen
  client.rooms[code].version=expected+5;
 }});
 const store=createRoomStore(client,{retries:3,delay:()=>0});
 await assert.rejects(()=>store.withRoom('111111',rooms=>{rooms['111111'].score++}),/ลองใหม่อีกครั้ง/);
});

test('question bank store: empty database falls back to the bundled defaults',async()=>{
 const store=createQuestionBankStore(fakeClient());
 assert.deepEqual(await store.load(),questions);
});
test('question bank store: save validates, normalizes and persists; load reflects it afterward',async()=>{
 const client=fakeClient();
 const store=createQuestionBankStore(client);
 const edit=questions.map(q=>q.id===0?{id:0,text:'  แก้ไข  ',options:['a','b','c','d'],correct:1,explanation:'อธิบาย'}:{id:q.id,text:q.text,options:q.options,correct:q.correct,explanation:q.explanation});
 const saved=await store.save(edit);
 assert.equal(saved[0].text,'แก้ไข');
 assert.equal((await store.load())[0].text,'แก้ไข');
});
test('question bank store: save(null) resets to defaults',async()=>{
 const client=fakeClient({questionBank:questions.map(q=>q.id===0?{...q,text:'ของเก่า'}:q)});
 const store=createQuestionBankStore(client);
 const reset=await store.save(null);
 assert.equal(reset[0].text,questions[0].text);
});
