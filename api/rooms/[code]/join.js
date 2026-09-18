import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, checkOrigin } from '../../../lib/api-helpers.js';
import { createRoomStore } from '../../../lib/store.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const {code} = req.query;
 const store = createRoomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).join(code, req.body?.name, req.body?.employeeId, false, req.body?.joinKey ?? null));
 send(res, 200, result);
});
