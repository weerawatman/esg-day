import { withRoute, send, checkOrigin, adminTokenFor } from '../../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'POST') throw new Error('ไม่รองรับคำสั่งนี้');
 checkOrigin(req);
 const password = process.env.ADMIN_PASSWORD;
 if (!password) throw new Error('เซิร์ฟเวอร์ยังไม่ได้ตั้งรหัสผ่านผู้ดูแล (ADMIN_PASSWORD)');
 if (typeof req.body?.password !== 'string' || req.body.password !== password) throw new Error('รหัสผ่านไม่ถูกต้อง');
 send(res, 200, {adminToken: adminTokenFor(password)});
});
