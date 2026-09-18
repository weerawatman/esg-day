// Write-only mirror of room state into queryable tables, for the operator to inspect in
// Supabase directly (Table Editor / SQL) — who's on which team, who got which question
// right or wrong, per-player and per-team totals. The app never reads this back; the
// room's own JSONB blob in lib/store.js stays the single source of truth for gameplay.
export function createReportingStore(client) {
 async function sync(code, room) {
  if (!room?.rules?.questions?.length || !room.players?.length) return;
  const teams = room.rules.teams;
  const playerRows = room.players.map(p => ({
   room_code: code,
   employee_id: p.employeeId,
   name: p.name,
   team_id: p.team,
   team_name: teams[p.team]?.name ?? null,
   score: p.score,
   bot: Boolean(p.bot),
   updated_at: new Date().toISOString(),
  }));
  const {error: playersError} = await client.from('players').upsert(playerRows, {onConflict: 'room_code,employee_id'});
  if (playersError) throw new Error('บันทึกรายชื่อผู้เล่นไม่สำเร็จ');

  const answerRows = [];
  for (const [qKey, answersForQuestion] of Object.entries(room.answers || {})) {
   const questionId = Number(qKey);
   const question = room.rules.questions[questionId];
   if (!question) continue;
   const voided = room.voided?.includes(questionId) ?? false;
   for (const [playerId, answer] of Object.entries(answersForQuestion)) {
    const player = room.players.find(p => p.id === playerId);
    if (!player) continue;
    answerRows.push({
     room_code: code,
     employee_id: player.employeeId,
     question_id: questionId,
     choice: answer.choice,
     correct: answer.choice === question.correct,
     voided,
     answered_at: new Date().toISOString(),
    });
   }
  }
  if (answerRows.length) {
   const {error: answersError} = await client.from('answers').upsert(answerRows, {onConflict: 'room_code,employee_id,question_id'});
   if (answersError) throw new Error('บันทึกคำตอบไม่สำเร็จ');
  }
 }
 return {sync};
}
