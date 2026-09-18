import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export function supabase() {
 const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error('เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
 return createClient(url, key, {auth: {persistSession: false}});
}
export function send(res, status, data) {
 res.status(status).json(data);
}
export function bearer(req) {
 return req.headers.authorization?.replace(/^Bearer /, '');
}
export function checkOrigin(req) {
 if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new Error('ไม่อนุญาตคำสั่งจากเว็บไซต์อื่น');
}
export function adminTokenFor(password) {
 return createHash('sha256').update(password).digest('hex');
}
export function requireAdmin(req) {
 const password = process.env.ADMIN_PASSWORD;
 if (!password) throw new Error('เซิร์ฟเวอร์ยังไม่ได้ตั้งรหัสผ่านผู้ดูแล (ADMIN_PASSWORD)');
 if (bearer(req) !== adminTokenFor(password)) throw new Error('ไม่มีสิทธิ์เข้าหน้านี้ กรุณาเข้าสู่ระบบผู้ดูแล');
}
export function withRoute(handler) {
 return async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
  try {
   await handler(req, res);
  } catch (e) {
   send(res, 400, {error: e.message});
  }
 };
}
