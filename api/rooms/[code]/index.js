import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, roomStore, bearer } from '../../../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'GET') throw new Error('ไม่รองรับคำสั่งนี้');
 const {code} = req.query;
 const store = roomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).view(code, bearer(req)));
 send(res, 200, result);
});
