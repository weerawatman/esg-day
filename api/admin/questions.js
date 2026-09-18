import { withRoute, send, supabase, requireAdmin, checkOrigin } from '../../lib/api-helpers.js';
import { createQuestionBankStore } from '../../lib/store.js';

export default withRoute(async (req, res) => {
 requireAdmin(req);
 const store = createQuestionBankStore(supabase());
 if (req.method === 'GET') return send(res, 200, {questions: await store.load()});
 if (req.method === 'POST') {
  checkOrigin(req);
  const bank = await store.save(req.body?.reset === true ? null : req.body?.questions);
  return send(res, 200, {questions: bank});
 }
 throw new Error('ไม่รองรับคำสั่งนี้');
});
