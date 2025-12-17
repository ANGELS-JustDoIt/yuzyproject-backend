import { db } from "../db/database.mjs";

// 일정 생성
export async function create(userIdx, title, description, scheduleDate) {
  return db
    .execute(
      "INSERT INTO schedule (user_idx, title, description, schedule_date) VALUES (?, ?, ?, ?)",
      [userIdx, title, description || null, scheduleDate]
    )
    .then((result) => getById(result[0].insertId));
}

// 일정 ID로 조회
export async function getById(scheduleId) {
  return db
    .execute(
      "SELECT schedule_id, user_idx, title, description, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date, created_at, updated_at FROM schedule WHERE schedule_id = ?",
      [scheduleId]
    )
    .then((result) => result[0][0]);
}

// 사용자의 일정 목록 조회 (날짜 범위 옵션)
export async function getSchedules(userIdx, startDate = null, endDate = null) {
  let sql =
    "SELECT schedule_id, user_idx, title, description, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date, created_at, updated_at FROM schedule WHERE user_idx = ?";
  const params = [userIdx];

  if (startDate && endDate) {
    sql += " AND schedule_date BETWEEN ? AND ?";
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += " AND schedule_date >= ?";
    params.push(startDate);
  } else if (endDate) {
    sql += " AND schedule_date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY schedule_date ASC, created_at ASC";

  return db.execute(sql, params).then((result) => result[0]);
}

// 특정 날짜의 일정 조회
export async function getSchedulesByDate(userIdx, scheduleDate) {
  return db
    .execute(
      "SELECT schedule_id, user_idx, title, description, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date, created_at, updated_at FROM schedule WHERE user_idx = ? AND schedule_date = ? ORDER BY created_at ASC",
      [userIdx, scheduleDate]
    )
    .then((result) => result[0]);
}

// 일정 수정
export async function update(
  scheduleId,
  userIdx,
  title,
  description,
  scheduleDate
) {
  return db
    .execute(
      "UPDATE schedule SET title = ?, description = ?, schedule_date = ? WHERE schedule_id = ? AND user_idx = ?",
      [title, description || null, scheduleDate, scheduleId, userIdx]
    )
    .then(() => getById(scheduleId));
}

// 일정 삭제
export async function deleteById(scheduleId, userIdx) {
  return db
    .execute("DELETE FROM schedule WHERE schedule_id = ? AND user_idx = ?", [
      scheduleId,
      userIdx,
    ])
    .then((result) => result[0].affectedRows > 0);
}
