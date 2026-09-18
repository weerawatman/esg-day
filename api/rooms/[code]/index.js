import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, bearer } from '../../../lib/api-helpers.js';
import { createRoomStore } from '../../../lib/store.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'GET') throw new Error('ไม่รองรับคำสั่งนี้');
 const {code} = req.query;
 const store = createRoomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).view(code, bearer(req)));
 send(res, 200, result);
});
