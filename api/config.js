import { withRoute, send } from '../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'GET') throw new Error('ไม่รองรับคำสั่งนี้');
 const publicUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
 send(res, 200, {addresses: [publicUrl], publicUrl});
});
