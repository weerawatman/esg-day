import QRCode from 'qrcode';
import { withRoute } from '../lib/api-helpers.js';

export default withRoute(async (req, res) => {
 if (req.method !== 'GET') throw new Error('ไม่รองรับคำสั่งนี้');
 const target = new URL(req.query.url);
 if (!['http:', 'https:'].includes(target.protocol) || target.href.length > 1500) throw new Error('ลิงก์ไม่ถูกต้อง');
 const svg = await QRCode.toString(target.href, {type: 'svg', margin: 2, width: 260, color: {dark: '#14283F', light: '#FFFFFF'}});
 res.setHeader('Content-Type', 'image/svg+xml');
 res.status(200).send(svg);
});
