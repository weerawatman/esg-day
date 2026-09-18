import { Game } from '../../lib/game.js';
import { withRoute, send, supabase, checkOrigin } from '../../lib/api-helpers.js';
import { createRoomStore, createQuestionBankStore } from '../../lib/store.js';
import { createReportingStore } from '../../lib/reporting.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const client = supabase();
 const bank = await createQuestionBankStore(client).load();
 const store = createRoomStore(client);
 const game = new Game({questions: () => bank});
 let result;
 for (let attempt = 0; ; attempt++) {
  result = game.create(req.body?.demo === true);
  try {
   await store.insertRoom(result.code, game.rooms[result.code]);
   break;
  } catch (e) {
   if (attempt >= 5) throw new Error('สร้างห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
 }
 // demo rooms already have 20 bot players by the time they're inserted; mirror them immediately
 await createReportingStore(client).sync(result.code, game.rooms[result.code]).catch(e => console.error('reporting sync failed:', e.message));
 send(res, 200, result);
});
