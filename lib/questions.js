// Office scenarios follow the company's ESG DAY 2026 deck (slides 2–8).
const raw = [
 {title:'เรื่องข้อมูล ใครต้องช่วยดูแล?',
  text:'เพื่อนบอกว่า “ดูแลข้อมูลให้ปลอดภัย เป็นหน้าที่ IT อยู่แล้ว” ข้อไหนถูกต้องที่สุด?',
  options:['IT รับผิดชอบคนเดียว','พนักงานทุกคนมีส่วนรับผิดชอบข้อมูลที่ตนใช้งาน','เฉพาะหัวหน้าแผนก','เฉพาะคนที่ส่งข้อมูลออกนอกบริษัท'],correct:1,
  explanation:'ข้อมูลเป็นทรัพย์สินของบริษัท พนักงานทุกคนมีส่วนช่วยดูแลข้อมูลที่ตนใช้งาน ไม่ใช่หน้าที่ของ IT เพียงอย่างเดียว',sourceSlides:[2,8],
  scene:{kind:'chat',label:'แชตทีม',heading:'เพื่อนร่วมงาน',body:'เรื่องข้อมูลปลอดภัย… IT ดูแลอยู่แล้วใช่ไหม?',meta:'09:05 · เริ่มวันทำงาน'}},
 {title:'ไฟล์นี้ ลับแค่ไหน?',
  text:'คุณได้รับ Drawing ลูกค้าที่ใช้ในการผลิต ตามนโยบายในสไลด์ ไฟล์นี้อยู่ในระดับใด?',
  options:['เผยแพร่ — Public','ปกปิด — Internal','ลับ — Confidential','ลับสูงสุด — Top Secret'],correct:3,
  explanation:'Drawing ลูกค้าเป็นข้อมูลลับสูงสุด เช่นเดียวกับสูตรการผลิตและทรัพย์สินทางปัญญา ต้องควบคุมการเข้าถึงและช่องทางส่งให้เหมาะสม',sourceSlides:[3],
  scene:{kind:'file',label:'ไฟล์แนบ',heading:'Customer_Drawing.pdf',body:'แบบชิ้นงานสำหรับการผลิต',meta:'จากลูกค้า · เอกสารสมมติ'}},
 {title:'อยู่บริษัทเดียวกัน ดูได้ทุกคนไหม?',
  text:'ไฟล์เงินเดือนพนักงานควรจัดอยู่ในระดับใด ตามตัวอย่างในสไลด์?',
  options:['ลับ — Confidential','ปกปิด — Internal','เผยแพร่ — Public','ขึ้นอยู่กับว่าส่งในกลุ่มแชตไหน'],correct:0,
  explanation:'เงินเดือนเป็นข้อมูลระดับลับ การอยู่บริษัทเดียวกันไม่ได้หมายความว่าทุกคนมีสิทธิ์เข้าถึง ต้องตรวจสิทธิ์ผู้รับก่อนแชร์',sourceSlides:[3,5],
  scene:{kind:'file',label:'เอกสารฝ่ายบุคคล',heading:'Payroll_2026.xlsx',body:'รายงานเงินเดือนพนักงาน',meta:'ข้อมูลในภาพเป็นข้อมูลสมมติ'}},
 {title:'โพสต์ไหนแชร์ต่อได้?',
  text:'ข้อมูลใดอยู่ในกลุ่ม “เผยแพร่” ตามตัวอย่างในสไลด์?',
  options:['รายงาน KPI ภายใน','ผลการทดลอง','ข่าวประชาสัมพันธ์ที่บริษัทเผยแพร่แล้ว','แผนธุรกิจปีหน้า'],correct:2,
  explanation:'ข่าวประชาสัมพันธ์เป็นข้อมูลเผยแพร่ ส่วน KPI และผลการทดลองเป็นข้อมูลปกปิด และแผนธุรกิจเป็นข้อมูลลับ',sourceSlides:[3],
  scene:{kind:'files',label:'โฟลเดอร์งาน',heading:'เลือกก่อนแชร์',items:['KPI_Report.xlsx','Lab_Results.pdf','Company_News.pdf','Business_Plan.pptx'],meta:'4 ไฟล์ · คุณจะเลือกไฟล์ไหน?'}},
 {title:'ลิงก์เดียว สะดวกทั้งทีม?',
  text:'คุณจะแชร์รายงานภายในให้ทีมโครงการ วิธีไหนเหมาะสมที่สุด?',
  options:['เปิดให้ทุกคนที่มีลิงก์เข้าถึง จะได้ไม่ต้องขอสิทธิ์','ใช้ช่องทางที่บริษัทอนุญาต ให้สิทธิ์เฉพาะผู้เกี่ยวข้อง','อัปโหลดไว้ในพื้นที่ส่วนตัวแล้วส่งลิงก์','แชร์ให้ทั้งบริษัท เผื่อคนอื่นต้องใช้'],correct:1,
  explanation:'ตรวจทั้งผู้รับและช่องทาง ให้สิทธิ์เฉพาะผู้เกี่ยวข้องผ่านช่องทางที่บริษัทอนุญาต การมีลิงก์ไม่ได้แปลว่าควรมีสิทธิ์ดูข้อมูล',sourceSlides:[4,5,7],
  scene:{kind:'share',label:'แชร์โฟลเดอร์',heading:'Project_Report',body:'ใครเปิดลิงก์นี้ได้บ้าง?',items:['ทุกคนที่มีลิงก์','บุคคลที่ระบุ'],meta:'ตรวจการตั้งค่าก่อนส่ง'}},
 {title:'กาแฟแป๊บเดียว…',
  text:'คุณกำลังเปิดรายงานภายใน แล้วจะลุกไปหยิบกาแฟ ควรทำอย่างไรก่อน?',
  options:['ล็อกหน้าจอ','ย่อหน้าต่างรายงาน','เปิดหน้าอื่นทับไว้','ฝากเพื่อนโต๊ะข้าง ๆ ช่วยมอง'],correct:0,
  explanation:'ล็อกหน้าจอเมื่อออกจากโต๊ะ ช่วยลดโอกาสที่คนอื่นจะเข้าถึงข้อมูลผ่านเครื่องของเรา แม้จะออกไปเพียงช่วงสั้น ๆ',sourceSlides:[4],
  scene:{kind:'desktop',label:'โต๊ะทำงาน',heading:'รายงานภายในเปิดค้างอยู่',body:'“ไปหยิบกาแฟ เดี๋ยวกลับมา”',meta:'10:30 · พักสักครู่'}},
 {title:'ก่อนกด Send ขอ 3 วินาที',
  text:'ชุดคำถามใดตรงกับหลักคิดก่อนส่งข้อมูลในสไลด์?',
  options:['ไฟล์ใหญ่ไหม / เน็ตเร็วไหม / ส่งทันไหม','ใครขอ / ขอเมื่อไร / ต้องรีบแค่ไหน','ตั้งชื่อไฟล์หรือยัง / แนบครบไหม / มีสำเนาหรือยัง','ข้อมูลประเภทใด / ผู้รับมีสิทธิ์ไหม / ถ้าหลุดบน Facebook รับได้ไหม'],correct:3,
  explanation:'ก่อน Send, Share หรือ Upload ตรวจประเภทข้อมูล สิทธิ์ผู้รับ และผลกระทบหากข้อมูลเผยแพร่บน Facebook ถ้ารับไม่ได้ ให้หยุดและตรวจอีกครั้ง',sourceSlides:[5],
  scene:{kind:'email',label:'อีเมลฉบับร่าง',heading:'ส่งรายงานตามที่ขอ',body:'แนบรายงานมาให้แล้วนะครับ',meta:'แนบไฟล์แล้ว · ยังไม่ได้ส่ง'}},
 {title:'งานไหนให้ AI ช่วยได้?',
  text:'หากใช้ AI ผ่านเครื่องมือและวิธีที่บริษัทอนุญาต งานใดเหมาะสมที่สุด?',
  options:['อัปโหลดเงินเดือนโดยยังไม่ได้รับอนุญาต','ส่ง Drawing ลูกค้าโดยยังไม่ได้รับอนุญาต','คิดคำโปรยกิจกรรมจากข้อมูลทั่วไปที่เผยแพร่แล้ว','ส่งรายชื่อลูกค้าและเบอร์โทรโดยยังไม่ได้รับอนุญาต'],correct:2,
  explanation:'AI ช่วยคิดไอเดียและทำงานกับข้อมูลทั่วไปได้ แต่ต้องตรวจประเภทข้อมูลก่อน Prompt หรือ Upload ทุกครั้ง ข้อมูลส่วนบุคคลและความลับต้องได้รับอนุญาต',sourceSlides:[6],
  scene:{kind:'ai',label:'ผู้ช่วย AI',heading:'วันนี้ให้ช่วยงานอะไรดี?',body:'พิมพ์คำสั่ง หรือแนบไฟล์…',meta:'ก่อนเริ่ม ลองเลือกงานที่จะให้ AI ช่วย'}},
 {title:'ลบชื่อแล้ว ส่งให้ AI ได้เลย?',
  text:'เพื่อนจะลบชื่อลูกค้าออกจาก Drawing แล้วส่งเข้า AI ภายนอกที่ยังไม่ได้รับอนุญาต คุณควรแนะนำอย่างไร?',
  options:['ส่งได้ เพราะไม่มีชื่อลูกค้าแล้ว','หยุดก่อน Drawing ยังลับสูงสุด ต้องตรวจการอนุญาต','แปลงเป็นรูปภาพแล้วส่ง','ส่งเฉพาะบางหน้าได้ทันที'],correct:1,
  explanation:'การลบชื่อไม่ได้เปลี่ยน Drawing ให้เป็นข้อมูลเผยแพร่ ตัวเนื้อหายังเป็นข้อมูลลับสูงสุด ต้องตรวจการอนุญาตก่อนใช้กับ AI',sourceSlides:[3,6],
  scene:{kind:'chat',label:'แชตทีม · งานด่วน',heading:'เพื่อนร่วมงาน',body:'ลบชื่อลูกค้าออกแล้ว ส่ง Drawing ให้ AI ช่วยดูได้เลยไหม?',meta:'แนบไฟล์ Drawing_no_name.pdf'}},
 {title:'ด่วนแค่ไหน ก็ต้องเช็ก',
  text:'คู่ค้าขอไฟล์ต้นทุนผ่านแชตส่วนตัว ใช้ประชุมใน 5 นาที คุณยังไม่ทราบว่าเขามีสิทธิ์รับข้อมูลหรือไม่ ควรทำอย่างไร?',
  options:['หยุดตรวจประเภทข้อมูล สิทธิ์ผู้รับ และช่องทางก่อนส่ง','ส่งก่อน แล้วขออนุมัติย้อนหลัง','ใส่รหัสผ่านแล้วส่งทันที','ส่งเฉพาะหน้าที่ขอ โดยไม่ต้องตรวจสิทธิ์'],correct:0,
  explanation:'ความเร่งด่วนไม่ได้ยืนยันสิทธิ์เข้าถึงข้อมูล ต้นทุนเป็นข้อมูลลับ ใช้ลำดับ จำแนก → ตรวจสิทธิ์ → เลือกช่องทาง → หยุดหรือส่ง ไม่แน่ใจให้หยุด',sourceSlides:[3,7],
  scene:{kind:'chat',label:'แชตส่วนตัว',heading:'คู่ค้า',body:'ขอไฟล์ต้นทุนหน่อยครับ อีก 5 นาทีจะเข้าประชุมแล้ว ด่วนมาก!',meta:'14:55 · ยังไม่ได้ตรวจสิทธิ์ผู้รับ'}}
];
export const questions=raw.map((q,i)=>({...q,id:i,round:Math.floor(i/4)+1,points:1,seconds:30}));
export const teams=[{name:'SHIELD',thai:'ทีมโล่สายแกร่ง',color:'#158776',symbol:'shield'},{name:'KEY',thai:'ทีมกุญแจสายลุย',color:'#267DC4',symbol:'key'},{name:'RADAR',thai:'ทีมเรดาร์สายไว',color:'#DB6B26',symbol:'radar'}];
const ensure=(ok,message)=>{if(!ok)throw new Error(message)};
// admins may only edit wording (text/options/correct/explanation); id/round/points/seconds stay fixed to the approved 4/4/2 scoring structure
export function validateQuestionContent(list){
 ensure(Array.isArray(list)&&list.length===questions.length,`ต้องส่งคำถามให้ครบ ${questions.length} ข้อ`);
 const byId=new Map();
 for(const item of list){
  ensure(item&&Number.isInteger(item.id)&&questions.some(q=>q.id===item.id),'รหัสคำถามไม่ถูกต้อง');
  ensure(!byId.has(item.id),'มีรหัสคำถามซ้ำกัน');
  const n=item.id+1;
  ensure(typeof item.text==='string'&&item.text.trim().length>0&&item.text.trim().length<=280,`ข้อ ${n}: กรอกคำถาม 1–280 ตัวอักษร`);
  ensure(Array.isArray(item.options)&&item.options.length===4&&item.options.every(o=>typeof o==='string'&&o.trim().length>0&&o.trim().length<=160),`ข้อ ${n}: กรอกตัวเลือกให้ครบ 4 ข้อ ไม่เกิน 160 ตัวอักษรต่อข้อ`);
  ensure(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<4,`ข้อ ${n}: เลือกคำตอบที่ถูกต้อง`);
  ensure(typeof item.explanation==='string'&&item.explanation.trim().length>0&&item.explanation.trim().length<=400,`ข้อ ${n}: กรอกคำอธิบาย 1–400 ตัวอักษร`);
  byId.set(item.id,{id:item.id,text:item.text.trim(),options:item.options.map(o=>o.trim()),correct:item.correct,explanation:item.explanation.trim()});
 }
 return byId;
}
export function withContent(overrides){
 const byId=overrides?validateQuestionContent(overrides):null;
 return questions.map(q=>{
  const edit=byId?.get(q.id),result={...structuredClone(q),...edit};
  if(edit&&(edit.text!==q.text||edit.correct!==q.correct||edit.explanation!==q.explanation||edit.options.some((o,i)=>o!==q.options[i]))){
   delete result.scene;delete result.title;delete result.sourceSlides;
  }
  return result;
 });
}
