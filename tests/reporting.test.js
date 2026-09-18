import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportingStore } from '../lib/reporting.js';

function fakeClient() {
 const tables = {players: [], answers: []};
 return {
  tables,
  from(name) {
   return {
    upsert: async (rows) => {
     tables[name].push(...(Array.isArray(rows) ? rows : [rows]));
     return {error: null};
    },
   };
  },
 };
}

const teams = [{name: 'SHIELD'}, {name: 'KEY'}];
const questions = [{id: 0, correct: 1, points: 1}, {id: 1, correct: 2, points: 1}];
const baseRoom = () => ({
 rules: {teams, questions},
 players: [
  {id: 'p1', employeeId: 'EMP1', name: 'มายด์', team: 0, score: 1, bot: false},
  {id: 'p2', employeeId: 'EMP2', name: 'ก้อง', team: 1, score: 0, bot: true},
 ],
 answers: {0: {p1: {choice: 1}, p2: {choice: 0}}},
 voided: [],
});

test('sync is a no-op for a room with no players or no rules yet',async()=>{
 const client=fakeClient();
 const store=createReportingStore(client);
 await store.sync('111111',{rules:{teams,questions},players:[]});
 await store.sync('111111',{players:[{id:'p1',employeeId:'EMP1',name:'x',team:0,score:0}]});
 assert.deepEqual(client.tables.players,[]);assert.deepEqual(client.tables.answers,[]);
});
test('sync mirrors every player with their team name and running score',async()=>{
 const client=fakeClient();
 const store=createReportingStore(client);
 await store.sync('222222',baseRoom());
 assert.equal(client.tables.players.length,2);
 const mind=client.tables.players.find(p=>p.employee_id==='EMP1');
 assert.equal(mind.room_code,'222222');assert.equal(mind.name,'มายด์');assert.equal(mind.team_id,0);assert.equal(mind.team_name,'SHIELD');assert.equal(mind.score,1);assert.equal(mind.bot,false);
 const kong=client.tables.players.find(p=>p.employee_id==='EMP2');
 assert.equal(kong.team_name,'KEY');assert.equal(kong.bot,true);
});
test('sync records each answer with whether it was correct',async()=>{
 const client=fakeClient();
 const store=createReportingStore(client);
 await store.sync('222222',baseRoom());
 assert.equal(client.tables.answers.length,2);
 const mindAnswer=client.tables.answers.find(a=>a.employee_id==='EMP1');
 assert.equal(mindAnswer.question_id,0);assert.equal(mindAnswer.choice,1);assert.equal(mindAnswer.correct,true);assert.equal(mindAnswer.voided,false);
 const kongAnswer=client.tables.answers.find(a=>a.employee_id==='EMP2');
 assert.equal(kongAnswer.choice,0);assert.equal(kongAnswer.correct,false);
});
test('sync marks answers to a voided question as voided even if the choice was correct',async()=>{
 const client=fakeClient();
 const store=createReportingStore(client);
 const room=baseRoom();room.voided=[0];
 await store.sync('222222',room);
 const mindAnswer=client.tables.answers.find(a=>a.employee_id==='EMP1');
 assert.equal(mindAnswer.correct,true);assert.equal(mindAnswer.voided,true);
});
test('sync skips answers left behind by a player who no longer exists',async()=>{
 const client=fakeClient();
 const store=createReportingStore(client);
 const room=baseRoom();room.answers[1]={ghost:{choice:2}};
 await store.sync('222222',room);
 assert.equal(client.tables.answers.some(a=>a.employee_id===undefined),false);
 assert.equal(client.tables.answers.length,2);
});
