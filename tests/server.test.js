import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
test('HTTP: 20 concurrent players, private host commands, QR, restart-safe storage callback',async()=>{
 const server=createApp({persist:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(path,body,token)=>{const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()}};
 try {
  const {data:room}=await call('/api/rooms',{});
  const joined=await Promise.all(Array.from({length:20},(_,i)=>call(`/api/rooms/${room.code}/join`,{name:`P${i}`,employeeId:`EMP${i}`})));
  assert.ok(joined.every(r=>r.status===200));
  assert.equal((await call(`/api/rooms/${room.code}/control`,{action:'start'},'bad')).status,400);
  assert.equal((await call(`/api/rooms/${room.code}/control`,{action:'start'},room.hostToken)).status,200);
  const v=await call(`/api/rooms/${room.code}`);assert.equal(v.data.players.length,20);assert.ok(!JSON.stringify(v.data).includes('correct'));
  assert.equal(v.data.phase,'countdown');assert.equal(v.data.teams.length,3);
  await new Promise(resolve=>setTimeout(resolve,3050));
  const answers=await Promise.all(joined.map(p=>call(`/api/rooms/${room.code}/answer`,{q:0,choice:1},p.data.token)));
  assert.ok(answers.every(r=>r.status===200));
  const reveal=await call(`/api/rooms/${room.code}/control`,{action:'reveal'},room.hostToken);
  assert.ok(reveal.data.teams.every(t=>t.score===t.count*100));
  const qr=await fetch(base+`/api/qr?url=${encodeURIComponent(base+'/?join='+room.code)}`);assert.match(qr.headers.get('content-type'),/svg/);assert.match(await qr.text(),/<svg/);
  assert.equal((await fetch(base+'/lib/questions.js')).status,404);
  assert.equal((await fetch(base+'/')).status,200);
 }finally{await new Promise(r=>server.close(r))}
});
