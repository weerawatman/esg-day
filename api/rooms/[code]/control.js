import { Game } from '../../../lib/game.js';
import { withRoute, send, supabase, roomStore, checkOrigin, bearer } from '../../../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const {code} = req.query, auth = bearer(req);
 const store = roomStore(supabase());
 const result = await store.withRoom(code, rooms => new Game({rooms}).control(code, auth, req.body?.action, req.body || {}));
 send(res, 200, result);
});
