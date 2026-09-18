import { withContent } from './questions.js';

// Serverless functions are stateless between invocations, so every request re-loads the
// relevant slice of state from Postgres, runs the (synchronous, well-tested) Game logic
// against it, then writes back. Concurrent writers to the same room are resolved with an
// optimistic-concurrency retry loop (a `version` column) rather than a DB-side lock, since
// PostgREST doesn't expose multi-statement transactions to the JS client.
export function createRoomStore(client, {retries = 8, delay = attempt => 20 + Math.random() * 40 * (attempt + 1)} = {}) {
 async function loadRoom(code) {
  const {data, error} = await client.from('rooms').select('data,version').eq('code', code).maybeSingle();
  if (error) throw new Error('เชื่อมต่อฐานข้อมูลไม่ได้');
  return data;
 }
 async function insertRoom(code, roomData) {
  const {error} = await client.from('rooms').insert({code, data: roomData, version: 0});
  if (error) throw error;
 }
 async function saveRoom(code, roomData, expectedVersion) {
  const {data, error} = await client.from('rooms').update({data: roomData, version: expectedVersion + 1, updated_at: new Date().toISOString()}).eq('code', code).eq('version', expectedVersion).select('version');
  if (error) throw new Error('บันทึกห้องไม่สำเร็จ');
  return data.length > 0;
 }
 async function withRoom(code, run) {
  for (let attempt = 0; attempt < retries; attempt++) {
   const row = await loadRoom(code);
   if (!row) throw new Error('ไม่พบห้องนี้ กรุณาตรวจสอบรหัสห้อง');
   // Game methods mutate the room object in place, so the "did anything change" check
   // must be taken before that happens — `rooms[code]` and `row.data` are the same
   // reference, and comparing an object against itself after mutating it is always equal.
   const before = JSON.stringify(row.data);
   const rooms = {[code]: row.data};
   const result = run(rooms);
   if (JSON.stringify(rooms[code]) === before) return result;
   if (await saveRoom(code, rooms[code], row.version)) return result;
   await new Promise(r => setTimeout(r, delay(attempt)));
  }
  throw new Error('ระบบมีผู้ใช้งานพร้อมกันในห้องนี้จำนวนมาก กรุณาลองใหม่อีกครั้ง');
 }
 return {loadRoom, insertRoom, saveRoom, withRoom};
}

export function createQuestionBankStore(client) {
 async function load() {
  const {data, error} = await client.from('question_bank').select('data').eq('id', 1).maybeSingle();
  if (error) throw new Error('เชื่อมต่อฐานข้อมูลไม่ได้');
  return withContent(data?.data ?? null);
 }
 async function save(overrides) {
  const bank = withContent(overrides);
  const {error} = await client.from('question_bank').upsert({id: 1, data: bank, updated_at: new Date().toISOString()});
  if (error) throw new Error('บันทึกคำถามไม่สำเร็จ');
  return bank;
 }
 return {load, save};
}
