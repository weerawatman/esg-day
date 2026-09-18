import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, roomStore, checkOrigin } from '../../../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const {code} = req.query;
 const store = roomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).join(code, req.body?.name, req.body?.employeeId, false, req.body?.joinKey ?? null));
 send(res, 200, result);
});
