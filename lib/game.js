import { randomBytes, randomInt } from 'node:crypto';
import { questions, teams } from './questions.js';
import { questions as legacyQuestions, teams as legacyTeams } from './legacy-questions.js';
const token=()=>randomBytes(24).toString('hex');
const ensure=(ok,message)=>{if(!ok)throw new Error(message)};
const legacyRules={version:1,questions:legacyQuestions,teams:legacyTeams};

export class Game {
 constructor({rooms={},now=()=>Date.now(),save=()=>{},choose=randomInt}={}){this.rooms=rooms;this.now=now;this.save=save;this.choose=choose}
 changed(){this.save(this.rooms)}
 shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=this.choose(i+1);[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
 // shuffle within each round only: round boundaries, points and the "double points, last two" narrative are fixed positions the UI hardcodes
 shuffledQuestions(){
  const rounds=[1,2,3].map(round=>this.shuffle(questions.filter(q=>q.round===round).map(q=>({...q}))));
  return rounds.flat().map((q,i)=>({...q,id:i}));
 }
 get(code){const r=this.rooms[code];ensure(r,'ไม่พบห้องนี้ กรุณาตรวจสอบรหัสห้อง');return r}
 rules(r){return r.rules||legacyRules}
 question(r){const q=this.rules(r).questions[r.q];return {...q,seconds:r.seconds??q.seconds}}
 create(demo=false){
  let code;do{code=String(randomInt(100000,1000000))}while(this.rooms[code]);
  const r={code,hostToken:token(),phase:'lobby',q:0,players:[],answers:{},voided:[],deadline:0,created:this.now(),demo:Boolean(demo),seconds:20,rules:{version:2,teams:structuredClone(teams),questions:this.shuffledQuestions()}};
  this.rooms[code]=r;
  if(demo)for(let i=0;i<20;i++)this.join(code,`ผู้เล่นจำลอง ${i+1}`,`DEMO${i+1}`,true);
  this.changed();return {code,hostToken:r.hostToken};
 }
 join(code,name,employeeId,bot=false,joinKey=null){
  const r=this.get(code);
  ensure(typeof name==='string'&&name.trim().length>0&&name.trim().length<=24,'กรุณาใช้ชื่อเล่น 1–24 ตัวอักษร');
  ensure(typeof employeeId==='string'&&/^[A-Za-z0-9_-]{1,32}$/.test(employeeId.trim()),'กรุณากรอกรหัสพนักงาน 1–32 ตัว ใช้อักษรอังกฤษ ตัวเลข - หรือ _');
  employeeId=employeeId.trim().toUpperCase();
  if(joinKey!==null){
   ensure(typeof joinKey==='string'&&/^[a-f0-9]{48}$/.test(joinKey),'รหัสคำขอเข้าร่วมไม่ถูกต้อง');
   const previous=r.players.find(p=>p.joinKey===joinKey);
   if(previous){ensure(previous.employeeId===employeeId,'คำขอนี้ใช้กับรหัสพนักงานอื่นแล้ว');return {...previous}}
  }
  ensure(r.phase==='lobby','เกมเริ่มแล้ว เข้าร่วมได้ในห้องถัดไป');
  ensure(!r.players.some(p=>p.employeeId===employeeId),'รหัสพนักงานนี้เข้าห้องแล้ว กรุณากลับเข้าเบราว์เซอร์เดิม');
  ensure(r.players.length<40,'ห้องนี้มีผู้เล่นครบ 40 คนแล้ว');
  const counts=this.rules(r).teams.map((_,i)=>r.players.filter(p=>p.team===i).length);
  const candidates=counts.map((count,i)=>({count,i})).filter(t=>t.count===Math.min(...counts));
  const p={id:token().slice(0,12),token:token(),employeeId,name:name.trim(),team:candidates[this.choose(candidates.length)].i,score:0,bot,...(joinKey?{joinKey}:{})};
  r.players.push(p);this.changed();return {...p};
 }
 host(r,t){ensure(typeof t==='string'&&t===r.hostToken,'เฉพาะผู้ดำเนินกิจกรรมเท่านั้น')}
 ranking(r){
  const max=this.rules(r).questions.reduce((sum,q)=>sum+q.points,0);
  const ranked=this.rules(r).teams.map((team,id)=>{const ps=r.players.filter(p=>p.team===id),score=ps.reduce((s,p)=>s+p.score,0);return {...team,id,count:ps.length,score,percent:ps.length?score/(ps.length*max)*100:0}});
  for(const t of ranked){t.rank=1+ranked.filter(other=>other.percent>t.percent).length;t.delta=(r.previousRanks?.[t.id]??t.rank)-t.rank}
  return ranked;
 }
 refresh(r){
  let dirty=false;
  if(r.phase==='countdown'&&this.now()>=r.started){r.phase='question';dirty=true}
  if(r.phase==='question'){
   if(r.demo&&this.now()<r.deadline){
    for(const p of r.players.filter(p=>p.bot))if(!r.answers[r.q]?.[p.id]&&this.now()>=r.started+1200+r.players.indexOf(p)*250){r.answers[r.q]??={};r.answers[r.q][p.id]={choice:randomInt(10)<7?this.question(r).correct:randomInt(4)};dirty=true}
   }
   if(this.now()>=r.deadline||Object.keys(r.answers[r.q]||{}).length===r.players.length){r.phase='closed';dirty=true}
  }
  if(dirty)this.changed();
 }
 open(r){
  r.previousRanks=this.ranking(r).map(t=>t.rank);
  const intro=this.rules(r).version>=2?3000:0;
  r.phase=intro?'countdown':'question';r.started=this.now()+intro;r.deadline=r.started+this.question(r).seconds*1000;
 }
 control(code,t,action,payload={}){
  const r=this.get(code);this.host(r,t);this.refresh(r);const rules=this.rules(r);
  if(action==='settings'){
   ensure(r.phase==='lobby','ตั้งเวลาได้ก่อนเริ่มเกมเท่านั้น');ensure([15,20,30,45,60].includes(payload.seconds),'เลือกเวลา 15, 20, 30, 45 หรือ 60 วินาที');r.seconds=payload.seconds;
  }else if(action==='move'){
   ensure(r.phase==='lobby','เปลี่ยนทีมได้ก่อนเริ่มเกมเท่านั้น');const p=r.players.find(p=>p.id===payload.playerId);ensure(p&&Number.isInteger(payload.team)&&payload.team>=0&&payload.team<rules.teams.length,'ไม่พบผู้เล่นหรือทีม');p.team=payload.team;
  }else if(action==='start'){
   ensure(r.phase==='lobby'&&r.players.length>=rules.teams.length,`ต้องมีอย่างน้อย ${rules.teams.length} คนก่อนเริ่ม`);ensure(rules.teams.every((_,i)=>r.players.some(p=>p.team===i)),'แต่ละทีมต้องมีสมาชิกอย่างน้อย 1 คน');this.open(r);
  }else if(action==='close'){
   ensure(r.phase==='question','ข้อนี้ยังไม่เปิดหรือปิดรับคำตอบแล้ว');r.phase='closed';
  }else if(action==='reveal'){
   ensure(r.phase==='closed','ต้องปิดรับคำตอบก่อนเปิดเฉลย');for(const p of r.players)if(r.answers[r.q]?.[p.id]?.choice===this.question(r).correct)p.score+=this.question(r).points;r.phase='reveal';
  }else if(action==='void'){
   ensure(['question','closed'].includes(r.phase),'ยกเลิกข้อได้ก่อนเปิดเฉลยเท่านั้น');r.voided.push(r.q);r.phase='reveal';
  }else if(action==='leaderboard'){
   ensure(r.phase==='reveal','เปิดเฉลยก่อนดูอันดับ');r.phase='leaderboard';
  }else if(action==='next'){
   ensure(r.phase==='leaderboard'||(rules.version===1&&r.phase==='reveal'),'ดูอันดับทีมก่อนเปลี่ยนข้อ');if(r.q===rules.questions.length-1)r.phase='finished';else{r.q++;this.open(r)}
  }else throw new Error('ไม่พบคำสั่ง');
  this.changed();return this.view(code,t);
 }
 answer(code,t,q,choice){
  const r=this.get(code);this.refresh(r);const p=r.players.find(p=>p.token===t);ensure(p,'กรุณาเข้าร่วมห้องก่อน');
  ensure(r.phase==='question'&&this.now()<r.deadline,'หมดเวลาหรือยังไม่เปิดรับคำตอบ');ensure(q===r.q,'คำถามเปลี่ยนแล้ว กรุณาตอบข้อปัจจุบัน');ensure(Number.isInteger(choice)&&choice>=0&&choice<4,'กรุณาเลือกคำตอบ');
  r.answers[r.q]??={};ensure(!r.answers[r.q][p.id],'ส่งคำตอบข้อนี้ไปแล้ว');r.answers[r.q][p.id]={choice};this.refresh(r);this.changed();return this.view(code,t);
 }
 view(code,t){
  const r=this.get(code);this.refresh(r);const revealed=['reveal','leaderboard','finished'].includes(r.phase),q=this.question(r),rules=this.rules(r);
  const {correct,explanation,...safe}=q,me=r.players.find(p=>p.token===t),ranked=this.ranking(r),voided=r.voided.includes(r.q);
  const distribution=[0,0,0,0];for(const answer of Object.values(r.answers[r.q]||{}))distribution[answer.choice]++;
  const mine=me?r.answers[r.q]?.[me.id]?.choice:undefined;
  return {
   code:r.code,phase:r.phase,demo:r.demo,version:rules.version,settings:{seconds:r.seconds??q.seconds},
   question:r.phase==='lobby'?null:r.phase==='countdown'?{id:q.id,round:q.round,points:q.points,seconds:q.seconds}:{...safe,...(revealed?{correct,explanation}:{}),voided},
   total:rules.questions.length,started:r.started,deadline:r.deadline,serverNow:this.now(),answered:Object.keys(r.answers[r.q]||{}).length,
   ...(revealed?{distribution}:{}),players:r.players.map(({id,name,team,score})=>({id,name,team,score})),teams:ranked,
   unequal:new Set(ranked.map(t=>t.count)).size>1,isHost:t===r.hostToken,
   me:me?{id:me.id,name:me.name,team:me.team,score:me.score,answer:mine,...(revealed?{gained:!voided&&mine===correct?q.points:0}:{})}:null
  };
 }
}
