import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';
import { questions } from '../lib/questions.js';
function setup(n=20){let now=1000;const game=new Game({now:()=>now,choose:n=>n-1});const room=game.create();const players=Array.from({length:n},(_,i)=>game.join(room.code,`ผู้เล่น ${i+1}`,`EMP${i+1}`));const tick=ms=>now+=ms;const start=()=>{game.control(room.code,room.hostToken,'start');tick(3000)};return {game,room,players,tick,start}}
test('20 employees randomized among minimum-size teams, yielding 7/7/6; unique IDs and roster locking',()=>{
 const {game,room,players,start}=setup();assert.equal(players[0].team,2,'choose random tie result instead of first team');assert.deepEqual([0,1,2].map(t=>players.filter(p=>p.team===t).length).sort(),[6,7,7]);
 assert.throws(()=>game.join(room.code,'  ','EMP50'));assert.throws(()=>game.join(room.code,'ใหม่',' emp1 '));assert.throws(()=>game.join(room.code,'ใหม่',''));assert.throws(()=>game.control(room.code,room.hostToken,'move',{playerId:players[0].id,team:3}));assert.equal(game.view(room.code).players[0].employeeId,undefined);
 start();assert.throws(()=>game.join(room.code,'late','EMP50'));assert.throws(()=>game.control(room.code,room.hostToken,'move',{playerId:players[0].id,team:0}));
});
test('three-second intro hides question, blocks answers; selected timer closes at exact deadline',()=>{
 const {game,room,players,tick}=setup();assert.throws(()=>game.control(room.code,'bad','settings',{seconds:30}));assert.throws(()=>game.control(room.code,room.hostToken,'settings',{seconds:0}));
 game.control(room.code,room.hostToken,'settings',{seconds:30});game.control(room.code,room.hostToken,'start');assert.equal(game.view(room.code).phase,'countdown');assert.equal(game.view(room.code).question.text,undefined);
 assert.throws(()=>game.answer(room.code,players[0].token,0,1));tick(2999);assert.equal(game.view(room.code).phase,'countdown');tick(1);assert.equal(game.view(room.code).phase,'question');assert.equal(game.view(room.code).question.seconds,30);
 assert.throws(()=>game.control(room.code,room.hostToken,'settings',{seconds:20}));tick(30000);assert.throws(()=>game.answer(room.code,players[0].token,0,1));assert.equal(game.view(room.code).phase,'closed');
});
test('solutions and histogram hidden; duplicate/stale answers rejected; reveal scored once',()=>{
 const {game,room,players,start,tick}=setup();start();let v=game.view(room.code,players[0].token);assert.equal(v.question.correct,undefined);assert.equal(v.question.explanation,undefined);assert.equal(v.distribution,undefined);assert.equal(v.hostToken,undefined);assert.equal(v.players[0].token,undefined);
 game.answer(room.code,players[0].token,0,1);assert.throws(()=>game.answer(room.code,players[0].token,0,1));assert.equal(game.view(room.code).teams[2].score,0);game.control(room.code,room.hostToken,'close');game.control(room.code,room.hostToken,'reveal');
 v=game.view(room.code,players[0].token);assert.equal(v.teams[2].score,1);assert.equal(v.question.correct,1);assert.deepEqual(v.distribution,[0,1,0,0]);assert.equal(v.me.gained,1);assert.throws(()=>game.control(room.code,room.hostToken,'reveal'));assert.throws(()=>game.control(room.code,room.hostToken,'next'));
 game.control(room.code,room.hostToken,'leaderboard');assert.equal(game.view(room.code).phase,'leaderboard');game.control(room.code,room.hostToken,'next');tick(3000);assert.throws(()=>game.answer(room.code,players[0].token,0,1));
});
test('ten questions, 10 points/player; 7/7/6 teams share perfect normalized rank; separate new room',()=>{
 const {game,room,players,start,tick}=setup();start();const answers=[1,2,0,3,2,1,0,3,1,3];answers.forEach((a,q)=>{players.forEach(p=>game.answer(room.code,p.token,q,a));assert.equal(game.view(room.code).phase,'closed');game.control(room.code,room.hostToken,'reveal');game.control(room.code,room.hostToken,'leaderboard');game.control(room.code,room.hostToken,'next');tick(3000)});
 const v=game.view(room.code);assert.equal(v.phase,'finished');assert.equal(v.total,10);assert.equal(v.teams.length,3);v.teams.forEach(t=>{assert.equal(t.score,t.count*10);assert.equal(t.percent,100);assert.equal(t.rank,1)});const next=game.create();assert.notEqual(next.code,room.code);assert.equal(game.view(next.code).players.length,0);assert.equal(game.view(room.code).players[0].score,10);
});
test('session snapshot restores employee identity, team, answer and points without re-randomizing',()=>{
 const {game,room,players,start}=setup();start();game.answer(room.code,players[0].token,0,1);game.control(room.code,room.hostToken,'close');game.control(room.code,room.hostToken,'reveal');const restored=new Game({rooms:JSON.parse(JSON.stringify(game.rooms)),now:()=>4000});const v=restored.view(room.code,players[0].token);assert.equal(v.me.id,players[0].id);assert.equal(v.me.team,players[0].team);assert.equal(v.me.answer,1);assert.equal(v.me.score,1);
});
test('void awards zero and exposes no further scoring path',()=>{
 const {game,room,players,start}=setup();start();game.answer(room.code,players[0].token,0,1);game.control(room.code,room.hostToken,'void');assert.equal(game.view(room.code).question.voided,true);assert.equal(game.view(room.code).teams[2].score,0);assert.throws(()=>game.control(room.code,room.hostToken,'reveal'));
});
test('legacy four-team room retains 12-question rules and original score denominator',()=>{
 const r={code:'123456',hostToken:'host',phase:'finished',q:11,players:[{id:'one',token:'player',name:'A',team:3,score:1600}],answers:{},voided:[],deadline:0};const game=new Game({rooms:{'123456':r}});const v=game.view('123456');assert.equal(v.total,12);assert.equal(v.teams.length,4);assert.equal(v.teams[3].percent,100);assert.equal(v.question.id,11);
});
test('each new room shuffles questions within their round only, keeping round/points fixed and id matching position',()=>{
 const identity=new Game({choose:n=>n-1}),idRoom=identity.create(),same=identity.rooms[idRoom.code].rules.questions;
 assert.deepEqual(same.map(q=>q.text),questions.map(q=>q.text),'choose:n=>n-1 leaves Fisher-Yates a no-op, so order should match the source file');
 const shuffled=new Game({choose:()=>0}),room=shuffled.create(),qs=shuffled.rooms[room.code].rules.questions;
 assert.deepEqual(qs.map(q=>q.round),[1,1,1,1,2,2,2,2,3,3]);assert.deepEqual(qs.map(q=>q.points),Array(10).fill(1));
 qs.forEach((q,i)=>assert.equal(q.id,i));
 const expected=[1,2,3,0,5,6,7,4,9,8].map(i=>questions[i].text);
 assert.deepEqual(qs.map(q=>q.text),expected,'choose:()=>0 always swaps toward index 0, rotating each round group by one');
});
test('an injected question bank (as the admin editor swaps in) feeds straight into freshly created rooms',()=>{
 const customBank=questions.map(q=>q.id===0?{...q,text:'แก้ไขคำถามข้อ 1',options:['ก','ข','ค','ง'],correct:3,explanation:'อธิบายใหม่'}:q);
 const game=new Game({choose:n=>n-1,questions:()=>customBank});
 const q0=game.rooms[game.create().code].rules.questions[0];
 assert.equal(q0.text,'แก้ไขคำถามข้อ 1');assert.deepEqual(q0.options,['ก','ข','ค','ง']);assert.equal(q0.correct,3);assert.equal(q0.explanation,'อธิบายใหม่');
});
test('lost join response can be retried with a pre-existing random request token, including after start',()=>{
 const {game,room}=setup(3),key='a'.repeat(48);
 const first=game.join(room.code,'ใหม่','EMP100',false,key);
 game.control(room.code,room.hostToken,'start');
 const retry=game.join(room.code,'ใหม่','emp100',false,key);
 assert.equal(retry.id,first.id);assert.equal(retry.token,first.token);assert.equal(retry.team,first.team);assert.equal(game.view(room.code).players.length,4);
 assert.throws(()=>game.join(room.code,'ใหม่','EMP100',false,'b'.repeat(48)));
 assert.throws(()=>game.join(room.code,'อื่น','EMP101',false,key));
 assert.equal(game.view(room.code).players[0].joinKey,undefined);
});
