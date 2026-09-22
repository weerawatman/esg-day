// Office props contain only fictional context. All text is escaped by the caller.
export const missionRounds=['รู้จักข้อมูล','ก่อนกด ส่ง แชร์ อัปโหลด','งานด่วน ชวนพลาด'];

export function officeScene(scene,esc){
 if(!scene)return '';
 const kinds=['chat','file','files','share','desktop','email','ai'];
 if(!kinds.includes(scene.kind))return '';
 const heading=`<h3>${esc(scene.heading||'')}</h3>`;
 const body=`<p>${esc(scene.body||'')}</p>`;
 let content='';
 if(scene.kind==='chat')content=`<div class="chat-sender"><span class="office-avatar" aria-hidden="true">${esc((scene.heading||'?').slice(0,1))}</span>${heading}</div><div class="chat-bubble">${body}</div><span class="chat-reply">คุณจะตอบว่า…</span>`;
 if(scene.kind==='file')content=`<div class="file-preview" aria-hidden="true"><span>${scene.heading?.endsWith('.xlsx')?'XLSX':'PDF'}</span><div class="document-lines"><i></i><i></i><i></i><i></i></div></div><div class="file-caption">${heading}${body}</div>`;
 if(scene.kind==='files')content=`${heading}<div class="office-file-list">${(scene.items||[]).map((item,i)=>`<div><span aria-hidden="true">${'ABCD'[i]}</span><b>${esc(item)}</b></div>`).join('')}</div>`;
 if(scene.kind==='share')content=`${heading}${body}<div class="share-settings">${(scene.items||[]).map(item=>`<div><span class="fake-radio" aria-hidden="true"></span>${esc(item)}</div>`).join('')}</div>`;
 if(scene.kind==='desktop')content=`<div class="office-monitor"><div class="monitor-bar"><i></i><i></i><i></i></div>${heading}<div class="spreadsheet-preview" aria-hidden="true"></div></div><div class="coffee-note">${body}<span aria-hidden="true">☕</span></div>`;
 if(scene.kind==='email')content=`<div class="mail-subject"><span>เรื่อง</span>${heading}</div>${body}<div class="mail-attachment">▤ Report.pdf</div><span class="fake-send">Send ↗</span>`;
 if(scene.kind==='ai')content=`<div class="ai-greeting"><span aria-hidden="true">✦</span>${heading}</div><div class="ai-prompt">${body}<span aria-hidden="true">＋ &nbsp; ↑</span></div>`;
 return `<aside class="office-scene scene-${scene.kind}" aria-label="สถานการณ์จำลอง"><div class="scene-toolbar"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(scene.label||'สถานการณ์')}</span><small>จำลอง</small></div><div class="scene-content">${content}</div><div class="scene-caption">${esc(scene.meta||'')}</div></aside>`;
}

export function perfectTeams(state,esc){
 const teams=state.teams.filter(t=>state.perfectTeamIds?.includes(t.id));
 if(!teams.length)return '';
 return `<div class="perfect-teams" role="status"><strong>✦ ทีมนี้ไม่มีหลุด!</strong>${teams.map(t=>`<span style="--team:${t.color}">${esc(t.name)} <small>ถูกครบ ${t.count} คน</small></span>`).join('')}</div>`;
}
