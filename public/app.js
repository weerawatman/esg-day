import { toggleSound, soundEnabled, playSound, celebrate } from './effects.js';
const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={shield:'M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6Z M8 12l3 3 5-6',key:'M14 10a5 5 0 1 0-4 4l3 3h3v3h4v-4l-6-6Z',radar:'M12 3a9 9 0 1 0 9 9 M12 7a5 5 0 1 0 5 5 M12 12l8-8 M12 3v9h9',vault:'M4 4h16v16H4Z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',trophy:'M7 3h10v6a5 5 0 0 1-10 0Z M7 5H3v3a4 4 0 0 0 4 4 M17 5h4v3a4 4 0 0 1-4 4 M12 14v5 M8 21h8 M9 19h6'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.shield}"/></svg>`;
const shapes=['▲','◆','●','■'];
const teamInfo=[{name:'SHIELD',thai:'ทีมโล่สายแกร่ง',symbol:'shield',color:'#158776'},{name:'KEY',thai:'ทีมกุญแจสายลุย',symbol:'key',color:'#267DC4'},{name:'RADAR',thai:'ทีมเรดาร์สายไว',symbol:'radar',color:'#DB6B26'}];
const roundNames=['อุ่นเครื่องเรื่องข้อมูล','จับให้ทันภัยใกล้ตัว','สองข้อชี้ชะตา'];
let config={},state=null,selected=null,selectedQ=-1,lastSignature='',busy=false,offset=0,polling=false,lastTick='',lastEffect='';
const params=new URLSearchParams(location.search);
const mode=params.has('host')?'host':params.has('screen')?'screen':params.has('join')?'player':params.has('admin')?'admin':'home';
const code=params.get('host')||params.get('screen')||params.get('join');
let credential=code?localStorage.getItem(`dg:${mode}:${code}`):mode==='admin'?localStorage.getItem('dg:admin'):null;
const isHost=()=>mode==='host';
let bank=null;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),4500)}
async function api(path,body){
 const res=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(credential?{Authorization:`Bearer ${credential}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'เชื่อมต่อไม่ได้');return data;
}
function connection(ok){$('#connection').innerHTML=`<i class="${ok?'':'offline'}"></i> ${ok?'เชื่อมต่อแล้ว':'กำลังเชื่อมต่อใหม่…'}`}
function home(){
 const recent=localStorage.getItem('dg:lastHost');
 app.innerHTML=`<section class="hero live-hero"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> THE LIVE TEAM QUIZ</div><h1>คิดให้ทัน.<br>ตอบให้เป๊ะ.<br><span class="accent">พาทีมขึ้นแท่น!</span></h1><p class="lead">10 คำถามเรื่องข้อมูล ที่จะทำให้ทั้งห้องลุ้นไปด้วยกัน<br>ลงชื่อ สุ่มทีม แล้วมาปล่อยพลังความรู้!</p><div class="hero-actions"><button class="primary" data-action="create">เปิดห้องกิจกรรม ↗</button><button class="secondary" data-action="demo">ลองเล่นโหมดสาธิต ▷</button></div><p class="micro">สำหรับผู้ดำเนินกิจกรรม${recent?` · <a href="/?host=${esc(recent)}">กลับห้องล่าสุด</a>`:''} · <a href="/?admin">จัดการคำถาม</a></p><div class="facts"><div><b>03</b><span>ทีมสุ่มอัตโนมัติ</span></div><div><b>10</b><span>คำถาม ช่วยกันคิด</span></div><div><b>1</b><span>คะแนนต่อข้อ เท่ากันทุกข้อ</span></div></div></div><div class="quiz-poster"><div class="poster-head"><span class="live-dot"></span> DATA GUARDIANS <span>LIVE!</span></div><div class="poster-question"><span>READY, TEAM?</span><h2>ข้อมูลปลอดภัย<br>เริ่มที่ใคร?</h2><div class="poster-clock">20<small>วินาที</small></div></div><div class="poster-answers">${['ทุกคนในทีม!','คนที่ส่งอีเมล','เฉพาะฝ่าย IT','ระบบจัดการให้'].map((s,i)=>`<div class="choice-${i}"><b>${shapes[i]}</b>${s}</div>`).join('')}</div><div class="poster-teams">${teamInfo.map(t=>`<span style="--team:${t.color}">${icon(t.symbol)} ${t.name}</span>`).join('')}</div><div class="poster-sticker">คิดด้วยกัน<br><b>ลุ้นด้วยกัน!</b></div></div></section>
 <section class="join-strip"><div><span class="eyebrow">GOT A GAME PIN?</span><h2>ห้องพร้อม ทีมรออยู่!</h2><p>สแกน QR ที่จอกลาง หรือกรอกรหัสห้องเพื่อเข้าเล่น</p></div><form id="room-form"><label for="room-code">รหัสห้อง 6 หลัก</label><div class="inline"><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required autocomplete="off"><button class="primary" type="submit">เข้าเล่น →</button></div></form></section>
 <section class="round-section"><div class="section-heading"><div><span class="eyebrow">WARM UP. LEVEL UP. TEAM UP.</span><h2>ยิ่งเล่น ยิ่งลุ้น</h2></div><button class="text-button" data-action="rules">กติกาแบบไว ๆ ↗</button></div><div class="round-grid">${roundNames.map((name,i)=>`<article class="round-card"><span class="round-num">0${i+1}</span><div><small>${['DATA GOVERNANCE','DATA SECURITY','FINAL SHOWDOWN'][i]}</small><h3>${name}</h3><p>${['ข้อมูลดีเป็นแบบไหน? ใครเป็นคนดูแล?<br>เริ่มจากเรื่องใกล้ตัวที่ทุกคนตอบได้','อีเมลหลอก บัญชียืม ไฟล์หลุด<br>ทีมคุณจะรู้ทันหรือเปล่า?','สถานการณ์จริง 2 ข้อชี้ชะตา<br>ทุกทีมยังมีโอกาสพลิกเกม!'][i]}</p><span class="pill">${i===2?'2':'4'} ข้อ · 1 คะแนน / คน / ข้อ</span></div></article>`).join('')}</div></section>`;
}
function joinForm(){
 app.innerHTML=`<div class="join-page"><span class="eyebrow">YOUR TEAM IS WAITING</span><h1>ลงชื่อให้พร้อม<br><span class="accent">แล้วไปลุ้นทีมกัน!</span></h1><div class="panel join-panel"><span class="pill">GAME PIN · ${esc(code)}</span><h2>ลงชื่อเข้าเล่น</h2><p>กรอกรหัสพนักงานและชื่อเล่น ระบบจะสุ่มทีมให้คุณ</p><form id="join-form"><label for="employee-id">รหัสพนักงาน</label><input id="employee-id" name="employeeId" placeholder="เช่น EMP001" maxlength="32" pattern="[A-Za-z0-9_-]{1,32}" title="อักษรอังกฤษ ตัวเลข ขีดกลาง หรือขีดล่าง" required autocomplete="off"><label for="nickname">ชื่อเล่นที่เพื่อนจะเห็น</label><input id="nickname" name="nickname" placeholder="เช่น มายด์" maxlength="24" required autocomplete="nickname"><button class="primary full" type="submit">สุ่มทีมแล้วเข้าเล่น →</button></form><small>รหัสพนักงานใช้ป้องกันการเข้าซ้ำในห้องนี้<br>จอกลางแสดงเฉพาะชื่อเล่น</small></div><a href="/" class="back-link">← กลับหน้าแรก</a></div>`;
}
function joinUrl(){return `${(localStorage.getItem('dg:base')||config.publicUrl||location.origin).replace(/\/$/,'')}/?join=${code}`}
function roomHeading(){
 const title={lobby:'รวมทีม เตรียมลุย!',countdown:'เตรียมตัวให้พร้อม',leaderboard:'อันดับขยับแล้วหรือยัง?',finished:'ภารกิจสำเร็จ!'}[state.phase]||`ข้อ ${state.question.id+1} / ${state.total}`;
 return `<div class="room-heading"><div><div class="eyebrow">${isHost()?'HOST CONTROL':mode==='screen'?'LIVE ON STAGE':'LET’S PLAY'} ${state.demo?'· โหมดสาธิต / ผู้เล่นจำลอง':''}</div><h1>${title}</h1></div><div class="room-tools"><span class="room-tag">GAME PIN <b>${code}</b></span><button class="secondary compact sound-control" data-action="sound" aria-pressed="${soundEnabled()}">${soundEnabled()?'♪ ปิดเสียง':'♪ เปิดเสียง'}</button>${isHost()?`<a class="secondary compact screen-link" href="/?screen=${code}" target="_blank" rel="noopener">จอกลาง ↗</a>`:''}<button class="icon-button" data-action="fullscreen" aria-label="เต็มหน้าจอ">⛶</button></div></div>`;
}
function teamCards(roster=false){
 return `<div class="teams-grid" style="--team-count:${state.teams.length}">${state.teams.map(t=>`<article class="team-card" style="--team:${t.color}"><div class="team-top"><span class="team-icon">${icon(t.symbol)}</span><span><small>TEAM ${String(t.id+1).padStart(2,'0')}</small><h3>${t.name}</h3></span><span class="member-count">${t.count} คน</span></div><p class="team-thai">${t.thai}</p>${roster?`<div class="roster">${state.players.filter(p=>p.team===t.id).map(p=>`<div class="member"><span class="avatar">${esc(p.name.slice(0,1))}</span><span>${esc(p.name)}${p.id===state.me?.id?' <small>(คุณ)</small>':''}</span>${isHost()?`<select aria-label="ย้ายทีม ${esc(p.name)}" data-player="${p.id}">${state.teams.map(tm=>`<option value="${tm.id}" ${tm.id===t.id?'selected':''}>${tm.name}</option>`).join('')}</select>`:''}</div>`).join('')||'<p class="empty">ใครจะได้เข้าทีมนี้?</p>'}</div>`:`<div class="team-score"><b>${state.unequal?t.percent.toFixed(2)+'%':t.score.toLocaleString()}</b><span class="rank">#${t.rank}</span></div><small>${t.score.toLocaleString()} คะแนนรวม · ${t.count} คน</small><div class="score-bar"><i style="width:${t.percent}%"></i></div>`}</article>`).join('')}</div>`;
}
function lobby(){return `${roomHeading()}<div class="lobby-banner"><div><span class="status-pill"><i class="live-dot"></i> ประตูห้องเปิดแล้ว</span><h2>สแกน ลงชื่อ<br>ลุ้นว่าคุณจะได้ทีมไหน!</h2><p>รหัสพนักงาน + ชื่อเล่น → สุ่มทีม → ตอบพร้อมกัน</p><div class="lobby-stats"><b>${state.players.length}<small> คนพร้อมลุย</small></b><span>${state.teams.length} ทีม · ${state.total} คำถาม · ${state.settings.seconds} วิ / ข้อ</span></div>${isHost()?`<div class="timer-setting"><label for="seconds-setting">เวลาตอบแต่ละข้อ</label><select id="seconds-setting">${[15,20,30,45,60].map(n=>`<option value="${n}" ${n===state.settings.seconds?'selected':''}>${n} วินาที</option>`).join('')}</select></div><button class="primary" data-control="start" ${state.teams.some(t=>!t.count)?'disabled':''}>เริ่มภารกิจ →</button><small class="block">ครบทุกทีมแล้วกดเริ่ม · มีเวลาเตรียมตัว 3 วินาทีก่อนทุกข้อ</small>`:`<div class="my-team-pill">${state.me?`${icon(state.teams[state.me.team].symbol)} คุณอยู่ทีม <b>${state.teams[state.me.team].name}</b>`:'เข้าห้องแล้วมาลุ้นไปด้วยกัน'}</div><p class="waiting">รอพิธีกรเริ่มเกม… เตรียมคุยกับทีมไว้เลย!</p>`}</div><div class="qr-panel"><img src="/api/qr?url=${encodeURIComponent(joinUrl())}" alt="QR Code สำหรับเข้าร่วมห้อง ${code}" width="210" height="210"><span>สแกนเพื่อเข้าเล่น</span><strong>${code}</strong><button class="text-button" data-action="copy">คัดลอกลิงก์เข้าร่วม</button></div></div>
 ${isHost()?`<details class="network"><summary>ลิงก์สำหรับมือถือ / ตั้งค่าเครือข่าย</summary><p>มือถือและเครื่องนี้ต้องเข้าถึงเครือข่ายเดียวกัน ทดลองสแกนก่อนเริ่ม</p><form id="base-form"><label for="base-url">ที่อยู่เซิร์ฟเวอร์ที่มือถือเข้าถึงได้</label><div class="inline"><input id="base-url" type="url" value="${esc(localStorage.getItem('dg:base')||config.publicUrl||location.origin)}" required><button class="secondary">อัปเดต QR</button></div></form></details>`:''}<div class="section-heading"><h2>เจอทีมของคุณหรือยัง?</h2><span class="muted">สุ่มทีมแบบจำนวนใกล้เคียงกัน · ${state.unequal?'จัดอันดับด้วย % คะแนนเต็มทีม':'ทุกคนช่วยทีมเก็บคะแนน'}</span></div>${teamCards(true)}`}
function progress(){return `<div class="question-dots" aria-label="ความคืบหน้า ${state.question.id+1} จาก ${state.total} ข้อ">${Array.from({length:state.total},(_,i)=>`<span class="${i===state.question.id?'active':i<state.question.id?'done':''}">${i+1}</span>`).join('')}<b>${roundNames[state.question.round-1]}</b></div>`}
function countdown(){return `${roomHeading()}${progress()}<section class="countdown-stage"><span class="eyebrow">QUESTION ${state.question.id+1} / ${state.total}</span><h2>${state.question.round===3?'โค้งสุดท้าย! พร้อมพลิกเกม?':'ปรึกษาทีม แล้วเตรียมตอบ!'}</h2><div class="countdown-number" id="intro-count">3</div><p>${state.me?`ทีม ${state.teams[state.me.team].name} สู้ ๆ!`:'ทุกทีมพร้อมแล้วใช่ไหม?'}</p><span class="pill">ข้อนี้ ${state.question.points} คะแนน · ${state.question.seconds} วินาที</span></section>`}
function hostControls(){if(!isHost())return '';const phase=state.phase;return `<div class="host-controls">${phase==='question'?'<button class="primary" data-control="close">ปิดรับคำตอบ</button>':phase==='closed'?'<button class="primary" data-control="reveal">เปิดเฉลยและให้คะแนน →</button>':phase==='reveal'?'<button class="primary" data-control="leaderboard">ลุ้นอันดับทีม →</button>':phase==='leaderboard'?`<button class="primary" data-control="next">${state.question.id===state.total-1?'ประกาศทีมชนะเลิศ 🏆':'ไปข้อถัดไป →'}</button>`:''}${['question','closed'].includes(phase)?'<button class="text-button" data-action="void">ยกเลิกข้อนี้</button>':''}</div>`}
function histogram(){const max=Math.max(...state.distribution,1);return `<div class="answer-chart" aria-label="จำนวนคำตอบแต่ละตัวเลือก">${state.distribution.map((n,i)=>`<div><b>${n} คน</b><div class="chart-track"><i class="choice-${i}" style="height:${Math.max(n/max*100,3)}%"></i></div><span>${shapes[i]} ${'ABCD'[i]} ${i===state.question.correct?'✓':''}</span></div>`).join('')}</div>`}
function quiz(){
 const q=state.question,revealed=state.phase==='reveal',answer=state.me?.answer,canAnswer=mode==='player'&&state.me&&state.phase==='question'&&answer===undefined;
 return `${roomHeading()}${progress()}<section class="game-stage"><div class="stage-meta"><span class="pill">${q.round===3?'โค้งสุดท้าย!':'ช่วยทีมเก็บแต้ม'} +${q.points}</span><span class="response-count"><b>${state.answered}</b> / ${state.players.length} คนตอบแล้ว</span></div><div class="question-spotlight"><div class="countdown-ring" id="timer-ring" style="--remaining:100%"><span id="timer">${q.seconds}</span><small>วินาที</small></div><h2>${esc(q.text)}</h2></div><div class="time-track"><i id="time-fill"></i></div></section>
 <div class="options live-options">${q.options.map((o,i)=>`<button class="option choice-${i} ${selected===i?'selected':''} ${revealed&&q.correct===i?'correct':''} ${revealed&&q.correct!==i?'muted-option':''} ${revealed&&answer===i&&q.correct!==i?'incorrect':''}" data-choice="${i}" aria-pressed="${selected===i}" ${!canAnswer?'disabled':''}><span class="choice-symbol">${shapes[i]}</span><span class="choice-text"><small>${'ABCD'[i]}</small>${esc(o)}</span>${revealed&&q.correct===i?'<b class="answer-check">✓</b>':selected===i?'<b class="answer-check">✓</b>':''}</button>`).join('')}</div>
 ${canAnswer?`<div class="submit-row"><p>ช่วยกันคิด แล้วกดยืนยัน<br><small>ยืนยันแล้วเปลี่ยนคำตอบไม่ได้</small></p><button class="primary" data-action="answer" ${selected===null?'disabled':''}>ยืนยันคำตอบ${selected!==null?' '+ 'ABCD'[selected]:''} →</button></div>`:state.me?`<div class="answer-status ${revealed&&state.me.gained>0?'success-status':''}">${answer!==undefined?`✓ ส่งคำตอบ ${'ABCD'[answer]} แล้ว`:'ปิดรับคำตอบแล้ว'}${revealed?` · ${q.voided?'ยกเลิกคะแนนข้อนี้':state.me.gained>0?`+${state.me.gained} คะแนนให้ทีม 🎉`:'ข้อนี้ได้ 0 คะแนน · ข้อหน้ามาใหม่!'}`:' · ลุ้นเฉลยพร้อมกัน'}</div>`:''}
 ${revealed?`<div class="reveal-panel"><div class="explanation"><span class="eyebrow">${q.voided?'ยกเลิกข้อนี้ · ทุกทีมได้ 0 คะแนน':'เฉลย '+ 'ABCD'[q.correct]+' · จำไว้ใช้จริง'}</span><p>${esc(q.explanation)}</p></div>${histogram()}</div>`:state.phase==='closed'?'<p class="closed-message">หมดเวลา! มาลุ้นคำตอบพร้อมกัน…</p>':''}${hostControls()}
 ${!isHost()&&revealed?'<p class="centered muted">เตรียมลุ้นอันดับทีมบนจอกลาง!</p>':''}`;
}
function leaderboard(){
 const ranked=[...state.teams].sort((a,b)=>a.rank-b.rank);
 return `${roomHeading()}<section class="leaderboard-stage"><span class="eyebrow">THE TEAM LEADERBOARD</span><h2>${state.question.id===state.total-1?'ใครจะคว้าแชมป์วันนี้?':'ทุกแต้ม เปลี่ยนเกมได้!'}</h2><p>หลังคำถาม ${state.question.id+1} / ${state.total} · ${state.unequal?'อันดับตาม % คะแนนเต็ม เพื่อให้ทีม 6 และ 7 คนแข่งขันได้ยุติธรรม':'อันดับตามคะแนนรวมทีม'}</p><div class="ranking-list">${ranked.map((t,i)=>`<article class="ranking-row" style="--team:${t.color};--delay:${i*.12}s"><span class="place">${t.rank===1?'♛':'#'+t.rank}</span><span class="team-icon">${icon(t.symbol)}</span><div class="ranking-name"><h3>${t.name}</h3><span>${t.count} คน · ${t.score.toLocaleString()} คะแนนรวม</span></div><span class="rank-change">${t.delta>0?'↑ '+t.delta:t.delta<0?'↓ '+Math.abs(t.delta):'–'}</span><strong>${state.unequal?t.percent.toFixed(2)+'%':t.score.toLocaleString()}<small>${state.unequal?'ของคะแนนเต็มทีม':'คะแนน'}</small></strong></article>`).join('')}</div><div class="comeback-line">${state.question.id===7?'🔥 โค้งสุดท้าย 2 ข้อชี้ชะตา!':state.question.id===state.total-1?'ทุกทีมทำเต็มที่แล้ว มาฉลองกัน!':'ปรึกษาทีมให้พร้อม แล้วไปเก็บแต้มข้อหน้า!'}</div></section>${hostControls()}${!isHost()?'<p class="centered muted">รอพิธีกรไปข้อถัดไป…</p>':''}`;
}
function finish(){const winners=state.teams.filter(t=>t.rank===1);return `${roomHeading()}<section class="winner"><span class="eyebrow">YOU PLAYED. YOU LEARNED. YOU PROTECTED.</span><div class="trophy">${icon('trophy')}</div><p>${winners.length>1?'แชมป์ร่วมแห่งภารกิจพิทักษ์ข้อมูล':'แชมป์แห่งภารกิจพิทักษ์ข้อมูล'}</p><h2>${winners.map(t=>t.name).join(' + ')}</h2><p>เก่งขึ้นไปด้วยกัน ขอบคุณทุกทีมที่ร่วมสนุก!</p><div class="winner-badges">${winners.map(t=>`<span style="--team:${t.color}">${icon(t.symbol)} ${state.unequal?t.percent.toFixed(2)+'% · ':''}${t.score.toLocaleString()} คะแนน</span>`).join('')}</div></section>${teamCards()}<div class="takeaways"><span>เล่นจบ แต่เอาไปใช้ต่อได้</span><b>ตรวจแหล่งข้อมูล</b><b>ให้สิทธิ์เท่าที่จำเป็น</b><b>พบความเสี่ยง รีบแจ้ง</b></div>${isHost()?'<div class="finish-actions"><button class="primary" data-action="create">เปิดห้องสำหรับกลุ่มถัดไป →</button><button class="secondary" data-action="export">ดาวน์โหลดผลการแข่งขัน</button><a class="text-button" href="/">กลับหน้าแรก</a></div>':'<p class="centered"><a href="/">กลับหน้าแรก</a></p>'}`}
function adminLogin(message){
 app.innerHTML=`<div class="join-page"><span class="eyebrow">ADMIN ONLY</span><h1>จัดการคำถาม</h1><div class="panel join-panel"><h2>เข้าสู่ระบบผู้ดูแล</h2><p>กรอกรหัสผ่านผู้ดูแลเพื่อแก้ไขคำถามทั้ง 10 ข้อ</p><form id="admin-login-form"><label for="admin-password">รหัสผ่าน</label><input id="admin-password" type="password" autocomplete="current-password" required><button class="primary full" type="submit">เข้าสู่ระบบ →</button></form></div><a href="/" class="back-link">← กลับหน้าแรก</a></div>`;
 if(message)toast(message);
}
function renderAdmin(){
 app.innerHTML=`<div class="room-heading"><div><div class="eyebrow">ADMIN</div><h1>จัดการคำถาม</h1></div><div class="room-tools"><button class="secondary compact" data-action="admin-reset">คืนค่าเริ่มต้น</button><button class="primary compact" data-action="admin-save">บันทึกทั้งหมด</button></div></div>
 <p class="muted">แก้ได้เฉพาะคำถาม ตัวเลือก คำตอบที่ถูก และคำอธิบาย ของ 10 ข้อเดิม ห้องที่เล่นอยู่หรือจบไปแล้วไม่เปลี่ยนตาม มีผลเฉพาะห้องที่เปิดใหม่หลังบันทึก</p>
 ${bank.map((q,qi)=>`<div class="panel question-edit" data-q="${qi}"><div class="section-heading"><h3>ข้อ ${qi+1} · รอบ ${q.round} · ${q.points} คะแนน/คน</h3></div>
 <label>คำถาม</label><textarea data-field="text" rows="2" maxlength="280">${esc(q.text)}</textarea>
 <div class="qa-grid">${q.options.map((o,oi)=>`<div class="qa-row"><label class="qa-radio"><input type="radio" name="correct-${qi}" data-field="correct" value="${oi}" ${q.correct===oi?'checked':''}><span>${'ABCD'[oi]}</span></label><input data-field="option" data-oi="${oi}" maxlength="160" value="${esc(o)}"></div>`).join('')}</div>
 <label>คำอธิบายหลังเฉลย</label><textarea data-field="explanation" rows="2" maxlength="400">${esc(q.explanation)}</textarea></div>`).join('')}
 <div class="finish-actions"><button class="secondary" data-action="admin-reset">คืนค่าเริ่มต้น</button><button class="primary" data-action="admin-save">บันทึกทั้งหมด</button><a class="text-button" href="/">กลับหน้าแรก</a></div>`;
}
async function loadQuestionBank(){
 const res=await api('/api/admin/questions');bank=res.questions.map(q=>({...q,options:[...q.options]}));renderAdmin();
}
async function adminInit(){
 if(!credential){adminLogin();return}
 try{await loadQuestionBank()}
 catch(e){credential=null;localStorage.removeItem('dg:admin');adminLogin(e.message)}
}
function render(){
 const input=$('#base-url'),draft=input?.value,expanded=$('.network')?.open,focused=document.activeElement;
 const focusId=focused?.id,focusChoice=focused?.dataset.choice;
 if(selectedQ!==state.question?.id){selected=null;selectedQ=state.question?.id}
 const views={lobby,countdown,leaderboard,finished:finish};app.innerHTML=(views[state.phase]||quiz)();
 if(input&&$('#base-url')){$('#base-url').value=draft;$('.network').open=expanded}
 if(focusId&&document.getElementById(focusId))document.getElementById(focusId).focus({preventScroll:true});
 else if(focusChoice!==undefined)$(`[data-choice="${focusChoice}"]`)?.focus({preventScroll:true});
 updateTimer();const effect=`${state.question?.id}:${state.phase}`;
 if(lastEffect!==effect){lastEffect=effect;if(state.phase==='question')playSound('ready');if(state.phase==='reveal')playSound(state.me?.gained?'correct':'board');if(state.phase==='leaderboard')playSound('board');if(state.phase==='finished'){playSound('winner');celebrate()}}
}
function updateTimer(){
 if(!state)return;const now=Date.now()+offset;
 if(state.phase==='countdown'){const n=Math.max(1,Math.ceil((state.started-now)/1000));const intro=$('#intro-count');if(intro&&intro.textContent!==String(n)){intro.textContent=n;intro.classList.remove('pop');void intro.offsetWidth;intro.classList.add('pop')}const key=`intro:${state.question.id}:${n}`;if(key!==lastTick){lastTick=key;playSound('tick')}return}
 const el=$('#timer');if(!el)return;
 const remaining=Math.max(0,state.deadline-now),secs=Math.ceil(remaining/1000),active=state.phase==='question';
 el.textContent=active?String(secs):'0';const percent=active?Math.min(100,remaining/(state.question.seconds*1000)*100):0;
 $('#timer-ring')?.style.setProperty('--remaining',`${percent}%`);$('#timer-ring')?.classList.toggle('urgent',active&&secs<=5);
 if($('#time-fill'))$('#time-fill').style.width=`${percent}%`;
 if(active&&secs<=5&&secs>0){const key=`tick:${state.question.id}:${secs}`;if(key!==lastTick){lastTick=key;playSound('tick')}}
 if(active&&secs===0){document.querySelectorAll('[data-choice],[data-action="answer"]').forEach(b=>b.disabled=true)}
}
async function poll(){
 if(!code||mode==='player'&&!credential||polling)return;polling=true;
 try{
  const s=await api(`/api/rooms/${code}`);connection(true);offset=s.serverNow-Date.now();
  if(isHost()&&!s.isHost){app.innerHTML='<div class="panel join-page"><h2>ไม่พบสิทธิ์ผู้ดำเนินกิจกรรม</h2><p>เปิดจากเบราว์เซอร์เดิมที่สร้างห้อง หรือกลับไปเปิดห้องใหม่</p><a href="/">กลับหน้าแรก</a></div>';return}
  state=s;const signature=JSON.stringify({...s,serverNow:0});if(signature!==lastSignature){lastSignature=signature;render()}
 }catch(e){connection(false);if(!state)app.innerHTML=`<div class="panel join-page"><h2>ยังเข้าห้องไม่ได้</h2><p>${esc(e.message)}</p><a href="/">กลับหน้าแรก</a></div>`}finally{polling=false}
}
async function create(demo){const room=await api('/api/rooms',{demo});localStorage.setItem(`dg:host:${room.code}`,room.hostToken);localStorage.setItem('dg:lastHost',room.code);location.href=`/?host=${room.code}`}
function showTeam(team){const dialog=document.createElement('dialog');dialog.className='team-reveal-dialog';dialog.innerHTML=`<span class="eyebrow">YOUR TEAM REVEAL</span><h2>สุ่มได้ทีม…</h2><div class="revealed-team" style="--team:${team.color}">${icon(team.symbol)}<h3>${team.name}</h3><p>${team.thai}</p></div><p>หาเพื่อนร่วมทีม แล้วเตรียมลุย!</p><button class="primary full">พร้อมลุยกับทีมนี้!</button>`;document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal();playSound('ready')}
function rules(){const dialog=document.createElement('dialog');dialog.innerHTML=`<button class="dialog-close" aria-label="ปิด">×</button><span class="eyebrow">PLAY TOGETHER. WIN TOGETHER.</span><h2>กติกาแบบไว ๆ</h2><ol><li>กรอกรหัสพนักงาน + ชื่อเล่น แล้วสุ่มเข้า 3 ทีม</li><li>ช่วยกันคิด แต่ทุกคนส่งคำตอบจากมือถือของตัวเอง</li><li>ตอบถูกได้ +1 คะแนนทุกข้อ ครบ 10 ข้อเต็ม 10 คะแนน</li><li>ดูนาฬิกาถอยหลัง! หมดเวลาแล้วส่งไม่ได้</li><li>เฉลยแล้วลุ้นอันดับ ทำแต้มสะสมจนครบ 10 ข้อ</li></ol><p>จำนวนคนต่างกัน จัดอันดับด้วย % คะแนนเต็มทีม<br>ไม่มีโบนัสความเร็ว · คะแนนเท่ากันเป็นแชมป์ร่วม</p><p class="micro">พิธีกรเลือกเวลาต่อข้อได้ 15 / 20 / 30 / 45 / 60 วินาที</p>`;document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();dialog.showModal()}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled||busy)return;
 if(b.dataset.choice!==undefined){selected=Number(b.dataset.choice);render();return}
 const action=b.dataset.action;
 try{
  busy=true;
  if(b.dataset.control){b.disabled=true;await api(`/api/rooms/${code}/control`,{action:b.dataset.control});await poll()}
  else if(action==='create'||action==='demo'){b.disabled=true;await create(action==='demo')}
  else if(action==='rules')rules();
  else if(action==='sound'){await toggleSound();b.textContent=soundEnabled()?'♪ ปิดเสียง':'♪ เปิดเสียง';b.setAttribute('aria-pressed',String(soundEnabled()))}
  else if(action==='answer'){b.disabled=true;await api(`/api/rooms/${code}/answer`,{q:state.question.id,choice:selected});await poll()}
  else if(action==='copy'){if(navigator.clipboard&&isSecureContext){await navigator.clipboard.writeText(joinUrl());toast('คัดลอกลิงก์แล้ว')}else window.prompt('คัดลอกลิงก์เข้าร่วม',joinUrl())}
  else if(action==='fullscreen'){if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
  else if(action==='void'&&confirm('ยกเลิกข้อนี้สำหรับทุกทีม? ทุกคนจะได้ 0 คะแนน')){await api(`/api/rooms/${code}/control`,{action:'void'});await poll()}
  else if(action==='export'){const result={room:code,demo:state.demo,exportedAt:new Date().toISOString(),ranking:state.teams,players:state.players};const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`data-guardians-${code}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  else if(action==='admin-save'){b.disabled=true;const res=await api('/api/admin/questions',{questions:bank});bank=res.questions.map(q=>({...q,options:[...q.options]}));toast('บันทึกคำถามแล้ว มีผลกับห้องที่เปิดใหม่');b.disabled=false}
  else if(action==='admin-reset'){if(!confirm('คืนค่าเริ่มต้นคำถามทั้งหมด? การแก้ไขที่ยังไม่บันทึกจะหายไป'))return;b.disabled=true;const res=await api('/api/admin/questions',{reset:true});bank=res.questions.map(q=>({...q,options:[...q.options]}));renderAdmin();toast('คืนค่าเริ่มต้นแล้ว')}
 }catch(err){toast(err.message);b.disabled=false;await poll()}finally{busy=false}
});
document.addEventListener('input',e=>{
 const row=e.target.closest('[data-q]');if(!row||!bank)return;const qi=Number(row.dataset.q),field=e.target.dataset.field;
 if(field==='option')bank[qi].options[Number(e.target.dataset.oi)]=e.target.value;
 else if(field==='text'||field==='explanation')bank[qi][field]=e.target.value;
});
document.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;const f=e.target;
 try{busy=true;
  if(f.id==='room-form')location.href=`/?join=${encodeURIComponent(f.elements.code.value)}`;
  if(f.id==='join-form'){
   let joinKey=localStorage.getItem(`dg:joinKey:${code}`);
   if(!joinKey){joinKey=Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>n.toString(16).padStart(2,'0')).join('');localStorage.setItem(`dg:joinKey:${code}`,joinKey)}
   const p=await api(`/api/rooms/${code}/join`,{name:f.elements.nickname.value,employeeId:f.elements.employeeId.value,joinKey});credential=p.token;localStorage.setItem(`dg:player:${code}`,credential);await poll();if(state?.teams[p.team])showTeam(state.teams[p.team]);
  }
  if(f.id==='base-form'){const base=new URL($('#base-url').value);if(!['http:','https:'].includes(base.protocol))throw new Error('ใช้ลิงก์ http หรือ https');localStorage.setItem('dg:base',base.origin);render();toast('อัปเดต QR Code แล้ว')}
  if(f.id==='admin-login-form'){const res=await api('/api/admin/login',{password:f.elements['admin-password'].value});credential=res.adminToken;localStorage.setItem('dg:admin',credential);await loadQuestionBank()}
 }catch(err){toast(err.message)}finally{busy=false}
});
document.addEventListener('change',async e=>{
 if(e.target.dataset.field==='correct'){const row=e.target.closest('[data-q]');bank[Number(row.dataset.q)].correct=Number(e.target.value);return}
 try{
  if(e.target.dataset.player)await api(`/api/rooms/${code}/control`,{action:'move',playerId:e.target.dataset.player,team:Number(e.target.value)});
  if(e.target.id==='seconds-setting')await api(`/api/rooms/${code}/control`,{action:'settings',seconds:Number(e.target.value)});
  await poll();
 }catch(err){toast(err.message)}
});
try{config=await api('/api/config');connection(true)}catch{connection(false)}
if(mode==='home')home();else if(mode==='player'&&!credential)joinForm();else if(mode==='admin')await adminInit();else await poll();
setInterval(poll,500);setInterval(updateTimer,100);
