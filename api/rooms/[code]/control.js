import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, checkOrigin, bearer } from '../../../lib/api-helpers.js';
import { createRoomStore } from '../../../lib/store.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const {code} = req.query, auth = bearer(req);
 const store = createRoomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).control(code, auth, req.body?.action, req.body || {}));
 send(res, 200, result);
});
