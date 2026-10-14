import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../lib/game.js';
import { questions, teamStyle } from '../lib/questions.js';
function setup(n=20){let now=1000;const game=new Game({now:()=>now,choose:n=>n-1});const room=game.create();Object.assign(game.rooms[room.code].rules,{version:2,teams:[0,1,2].map(i=>({...teamStyle(i),name:`ทีม ${i+1}`}))});const players=Array.from({length:n},(_,i)=>game.join(room.code,`ผู้เล่น ${i+1}`,`EMP${i+1}`));const tick=ms=>now+=ms;const start=()=>{game.control(room.code,room.hostToken,'start');tick(3000)};return {game,room,players,tick,start}}

test('any number of representatives can join, each creating their own named team',()=>{
 const game=new Game({choose:()=>0}),room=game.create();
 assert.deepEqual(game.view(room.code).teams,[],'a fresh room has no placeholder teams');
 const names=Array.from({length:12},(_,i)=>`ทีมที่ ${i+1}`);
 const players=names.map((teamName,i)=>game.join(room.code,`ตัวแทน ${i+1}`,`REP${i+1}`,false,null,teamName));
 const view=game.view(room.code);
 assert.equal(view.version,3);
 assert.deepEqual(view.teams.map(t=>t.name),names);
 assert.ok(view.teams.every(t=>t.count===1));
 assert.deepEqual(players.map(p=>p.team),names.map((_,i)=>i));
 assert.equal(new Set(view.teams.slice(0,10).map(t=>t.color)).size,10,'the first ten teams get distinct colours');
 assert.throws(()=>game.control(room.code,room.hostToken,'move',{playerId:players[0].id,team:1}),/ย้ายทีม/);
});

test('representatives sign in with only a team name and get unique internal IDs',()=>{
 const game=new Game({choose:()=>0}),room=game.create(),key='c'.repeat(48);
 const first=game.join(room.code,undefined,undefined,false,key,'ทีมดาวเหนือ');
 const second=game.join(room.code,'','',false,null,'ทีมสายฟ้า');
 assert.deepEqual([first.employeeId,second.employeeId],['TEAM01','TEAM02']);
 assert.equal(first.name,'ทีมดาวเหนือ');
 assert.equal(game.join(room.code,undefined,undefined,false,key,'ทีมดาวเหนือ').token,first.token,'same browser retry returns the same team');
 assert.throws(()=>game.join(room.code,undefined,undefined,false,null,'ทีมสายฟ้า'),/ชื่อทีมนี้/);
 assert.throws(()=>game.join(room.code,undefined,undefined,false,null,''),/ชื่อทีม/);
 const view=game.view(room.code);
 assert.deepEqual(view.teams.map(t=>t.thai),['',''],'no duplicate "representative" caption when the name is the team name');
 assert.ok(view.players.every(p=>p.employeeId===undefined));
});

test('host can end the game early; only revealed questions count',()=>{
 let now=1000;
 const game=new Game({now:()=>now,choose:()=>0}),room=game.create();
 const p=game.join(room.code,undefined,undefined,false,null,'ทีมเดียว');
 assert.throws(()=>game.control(room.code,'bad','end'),/ผู้ดำเนินกิจกรรม/);
 game.control(room.code,room.hostToken,'start');now+=3000;
 game.answer(room.code,p.token,0,game.rooms[room.code].rules.questions[0].correct);now+=30000;
 game.control(room.code,room.hostToken,'reveal');game.control(room.code,room.hostToken,'leaderboard');game.control(room.code,room.hostToken,'next');now+=3000;
 game.answer(room.code,p.token,1,game.rooms[room.code].rules.questions[1].correct);
 game.control(room.code,room.hostToken,'end');
 const v=game.view(room.code);
 assert.equal(v.phase,'finished');assert.equal(v.endedEarly,true);assert.equal(v.teams[0].score,2,'question 2 was never revealed, so it does not count');
 assert.throws(()=>game.control(room.code,room.hostToken,'end'),/จบไปแล้ว/);
});

test('rooms saved with three preset team slots fill those before adding more',()=>{
 const game=new Game({choose:()=>0}),room=game.create();
 game.rooms[room.code].rules.teams=[0,1,2].map(i=>({...teamStyle(i),name:`ทีม ${i+1}`}));
 const players=['ก','ข','ค','ง'].map((n,i)=>game.join(room.code,n,`REP${i}`,false,null,`ทีม${n}`));
 assert.deepEqual(players.map(p=>p.team),[0,1,2,3]);
 assert.deepEqual(game.view(room.code).teams.map(t=>t.name),['ทีมก','ทีมข','ทีมค','ทีมง']);
});

test('team names are required, unique, and safe to retry after joining',()=>{
 const game=new Game({choose:()=>0}),room=game.create(),key='a'.repeat(48);
 assert.throws(()=>game.join(room.code,'หนึ่ง','REP1',false,null,''),/ชื่อทีม/);
 assert.throws(()=>game.join(room.code,'หนึ่ง','REP1',false,null,' '.repeat(3)),/ชื่อทีม/);
 assert.throws(()=>game.join(room.code,'หนึ่ง','REP1',false,null,'ก'.repeat(25)),/ชื่อทีม/);
 const first=game.join(room.code,'หนึ่ง','REP1',false,key,'ทีม เอ');
 assert.throws(()=>game.join(room.code,'สอง','REP2',false,null,'ทีม เอ'),/ชื่อทีมนี้/);
 const retry=game.join(room.code,'หนึ่ง','rep1',false,key,'ทีม เอ');
 assert.equal(retry.token,first.token);
 assert.equal(game.view(room.code).players.length,1);
});

test('host can start with one representative and unoccupied teams cannot win',()=>{
 const game=new Game({choose:()=>0}),room=game.create();
 assert.throws(()=>game.control(room.code,room.hostToken,'start'),/ตัวแทน/);
 const p=game.join(room.code,'หนึ่ง','REP1',false,null,'ทีมหนึ่ง');
 game.control(room.code,room.hostToken,'start');
 const view=game.view(room.code,p.token);
 assert.equal(view.phase,'countdown');
 assert.deepEqual(view.teams.map(t=>t.rank),[1]);
});

test('representative answers score their named teams through all ten questions',()=>{
 let now=1000;
 const game=new Game({now:()=>now,choose:()=>0}),room=game.create();
 const players=['ทีม ก','ทีม ข','ทีม ค'].map((teamName,i)=>game.join(room.code,`คน ${i+1}`,`REP${i+1}`,false,null,teamName));
 game.control(room.code,room.hostToken,'start');now+=3000;
 for(let q=0;q<10;q++){
  const correct=game.rooms[room.code].rules.questions[q].correct;
  game.answer(room.code,players[0].token,q,correct);now+=100;
  game.answer(room.code,players[1].token,q,(correct+1)%4);now+=100;
  game.answer(room.code,players[2].token,q,correct);now+=30000;
  game.control(room.code,room.hostToken,'reveal');
  game.control(room.code,room.hostToken,'leaderboard');
  game.control(room.code,room.hostToken,'next');now+=3000;
 }
 const view=game.view(room.code);
 assert.equal(view.phase,'finished');
 assert.deepEqual(view.teams.map(t=>t.name),['ทีม ก','ทีม ข','ทีม ค']);
 assert.deepEqual(view.teams.map(t=>t.score),[20,0,10],'fastest correct team earns +1 on every question');
 assert.deepEqual(view.teams.map(t=>t.rank),[1,3,2]);
});

test('only the single fastest correct team earns the speed bonus; voided questions earn none',()=>{
 let now=1000;
 const game=new Game({now:()=>now,choose:()=>0}),room=game.create();
 const [fastWrong,slowRight,slowerRight]=['เร็วแต่ผิด','ถูกก่อน','ถูกทีหลัง'].map((t,i)=>game.join(room.code,`คน ${i}`,`REP${i}`,false,null,t));
 game.control(room.code,room.hostToken,'start');now+=3000;
 const correct=game.rooms[room.code].rules.questions[0].correct;
 game.answer(room.code,fastWrong.token,0,(correct+1)%4);now+=500;
 game.answer(room.code,slowRight.token,0,correct);now+=500;
 game.answer(room.code,slowerRight.token,0,correct);
 assert.equal(game.view(room.code).phase,'question','every team answering does not end the timer early');
 assert.throws(()=>game.control(room.code,room.hostToken,'close'),/ไม่พบคำสั่ง/);
 assert.throws(()=>game.control(room.code,room.hostToken,'reveal'),/หมดเวลา/);
 now+=30000;assert.equal(game.view(room.code).phase,'closed');
 assert.equal(game.view(room.code).fastestTeamId,undefined,'bonus winner stays hidden until reveal');
 game.control(room.code,room.hostToken,'reveal');
 const v=game.view(room.code,slowRight.token);
 assert.deepEqual(v.teams.map(t=>t.score),[0,2,1]);
 assert.equal(v.fastestTeamId,slowRight.team);assert.equal(v.me.gained,2);assert.equal(v.me.fastest,true);assert.equal(v.speedBonus,1);
 assert.equal(game.view(room.code,slowerRight.token).me.gained,1);
 game.control(room.code,room.hostToken,'leaderboard');game.control(room.code,room.hostToken,'next');now+=3000;
 game.answer(room.code,slowRight.token,1,game.rooms[room.code].rules.questions[1].correct);
 game.control(room.code,room.hostToken,'void');
 assert.equal(game.view(room.code).fastestTeamId,null);assert.deepEqual(game.view(room.code).teams.map(t=>t.score),[0,2,1]);
});

test('new rooms default to 30 seconds and keep office scenes with shuffled questions',()=>{
 const {game,room,start}=setup();assert.equal(game.view(room.code).settings.seconds,30);
 start();const q=game.view(room.code).question;
 assert.ok(q.scene);assert.equal(q.title,questions[0].title);
 assert.equal(q.sourceSlides,undefined,'attribution is revealed with the explanation');
});

test('closed phase shows only answer counts; all-correct badges require every team member and no void',()=>{
 const {game,room,players,start,tick}=setup(6);start();
 assert.equal(game.view(room.code).perfectTeamIds,undefined);
 const perfect=players.filter(p=>p.team===0);
 for(const p of perfect)game.answer(room.code,p.token,0,questions[0].correct);
 game.answer(room.code,players.find(p=>p.team===1).token,0,questions[0].correct);
 for(const p of players.filter(p=>p.team===2))game.answer(room.code,p.token,0,(questions[0].correct+1)%4);
 tick(30000);
 const closed=game.view(room.code);assert.equal(closed.distribution.reduce((a,b)=>a+b,0),5);
 assert.equal(closed.question.correct,undefined);assert.equal(closed.question.explanation,undefined);assert.equal(closed.perfectTeamIds,undefined);
 game.control(room.code,room.hostToken,'reveal');
 assert.deepEqual(game.view(room.code).perfectTeamIds,[0]);
 assert.deepEqual(game.view(room.code).question.sourceSlides,[2,8]);
 const other=setup(1);other.start();other.game.answer(other.room.code,other.players[0].token,0,questions[0].correct);
 other.game.control(other.room.code,other.room.hostToken,'void');
 assert.deepEqual(other.game.view(other.room.code).perfectTeamIds,[]);
});
test('existing multi-player rooms keep balanced assignment, unique IDs and roster locking',()=>{
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
 game.answer(room.code,players[0].token,0,1);assert.throws(()=>game.answer(room.code,players[0].token,0,1));assert.equal(game.view(room.code).teams[2].score,0);tick(30000);game.control(room.code,room.hostToken,'reveal');
 v=game.view(room.code,players[0].token);assert.equal(v.teams[2].score,1);assert.equal(v.question.correct,1);assert.deepEqual(v.distribution,[0,1,0,0]);assert.equal(v.me.gained,1);assert.throws(()=>game.control(room.code,room.hostToken,'reveal'));assert.throws(()=>game.control(room.code,room.hostToken,'next'));
 game.control(room.code,room.hostToken,'leaderboard');assert.equal(game.view(room.code).phase,'leaderboard');game.control(room.code,room.hostToken,'next');tick(3000);assert.throws(()=>game.answer(room.code,players[0].token,0,1));
});
test('existing multi-player room keeps 10-point scoring and normalized rank; new room stays separate',()=>{
 const {game,room,players,start,tick}=setup();start();const answers=questions.map(q=>q.correct);answers.forEach((a,q)=>{players.forEach(p=>game.answer(room.code,p.token,q,a));assert.equal(game.view(room.code).phase,'question');tick(30000);game.control(room.code,room.hostToken,'reveal');game.control(room.code,room.hostToken,'leaderboard');game.control(room.code,room.hostToken,'next');tick(3000)});
 const v=game.view(room.code);assert.equal(v.phase,'finished');assert.equal(v.total,10);assert.equal(v.teams.length,3);v.teams.forEach(t=>{assert.equal(t.score,t.count*10);assert.equal(t.percent,100);assert.equal(t.rank,1)});const next=game.create();assert.notEqual(next.code,room.code);assert.equal(game.view(next.code).players.length,0);assert.equal(game.view(room.code).players[0].score,10);
});
test('session snapshot restores employee identity, team, answer and points without re-randomizing',()=>{
 const {game,room,players,start,tick}=setup();start();game.answer(room.code,players[0].token,0,1);tick(30000);game.control(room.code,room.hostToken,'reveal');const restored=new Game({rooms:JSON.parse(JSON.stringify(game.rooms)),now:()=>4000});const v=restored.view(room.code,players[0].token);assert.equal(v.me.id,players[0].id);assert.equal(v.me.team,players[0].team);assert.equal(v.me.answer,1);assert.equal(v.me.score,1);
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
