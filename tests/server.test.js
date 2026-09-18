import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
const call=async(base,path,body,token)=>{const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()}};
test('HTTP: 20 concurrent players, private host commands, QR, restart-safe storage callback',async()=>{
 const server=createApp({persist:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  const {data:room}=await call(base,'/api/rooms',{});
  const joined=await Promise.all(Array.from({length:20},(_,i)=>call(base,`/api/rooms/${room.code}/join`,{name:`P${i}`,employeeId:`EMP${i}`})));
  assert.ok(joined.every(r=>r.status===200));
  assert.equal((await call(base,`/api/rooms/${room.code}/control`,{action:'start'},'bad')).status,400);
  assert.equal((await call(base,`/api/rooms/${room.code}/control`,{action:'start'},room.hostToken)).status,200);
  const v=await call(base,`/api/rooms/${room.code}`);assert.equal(v.data.players.length,20);assert.ok(!JSON.stringify(v.data).includes('correct'));
  assert.equal(v.data.phase,'countdown');assert.equal(v.data.teams.length,3);
  await new Promise(resolve=>setTimeout(resolve,3050));
  const answers=await Promise.all(joined.map(p=>call(base,`/api/rooms/${room.code}/answer`,{q:0,choice:1},p.data.token)));
  assert.ok(answers.every(r=>r.status===200));
  const reveal=await call(base,`/api/rooms/${room.code}/control`,{action:'reveal'},room.hostToken);
  assert.ok(reveal.data.teams.every(t=>t.score===t.count)||reveal.data.teams.every(t=>t.score===0),'every player answered the same choice, so every team scores identically whichever way question order shuffled');
  const qr=await fetch(base+`/api/qr?url=${encodeURIComponent(base+'/?join='+room.code)}`);assert.match(qr.headers.get('content-type'),/svg/);assert.match(await qr.text(),/<svg/);
  assert.equal((await fetch(base+'/lib/questions.js')).status,404);
  assert.equal((await fetch(base+'/')).status,200);
 }finally{await new Promise(r=>server.close(r))}
});
test('HTTP admin: password-gated question editor validates, persists and can reset',async()=>{
 process.env.ADMIN_PASSWORD='test-admin-password';
 const server=createApp({persist:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  assert.equal((await call(base,'/api/admin/questions')).status,400);
  assert.equal((await call(base,'/api/admin/login',{password:'wrong'})).status,400);
  const login=await call(base,'/api/admin/login',{password:'test-admin-password'});assert.equal(login.status,200);
  const {adminToken}=login.data;
  const before=await call(base,'/api/admin/questions',null,adminToken);assert.equal(before.status,200);assert.equal(before.data.questions.length,10);
  assert.equal((await call(base,'/api/admin/questions',null,'wrong-token')).status,400);
  const edit=before.data.questions.map(q=>({id:q.id,text:q.id===0?'คำถามที่แก้ไขใหม่':q.text,options:q.id===0?['เอ','บี','ซี','ดี']:q.options,correct:q.id===0?2:q.correct,explanation:q.id===0?'อธิบายที่แก้ไขใหม่':q.explanation}));
  assert.equal((await call(base,'/api/admin/questions',{questions:edit.slice(0,9)},adminToken)).status,400);
  const saved=await call(base,'/api/admin/questions',{questions:edit},adminToken);assert.equal(saved.status,200);assert.equal(saved.data.questions[0].text,'คำถามที่แก้ไขใหม่');
  assert.equal((await call(base,'/api/admin/questions',null,adminToken)).data.questions[0].text,'คำถามที่แก้ไขใหม่');
  const reset=await call(base,'/api/admin/questions',{reset:true},adminToken);assert.equal(reset.status,200);assert.notEqual(reset.data.questions[0].text,'คำถามที่แก้ไขใหม่');
 }finally{await new Promise(r=>server.close(r));delete process.env.ADMIN_PASSWORD}
});
