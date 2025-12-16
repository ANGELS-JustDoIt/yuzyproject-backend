import { db } from "../db/database.mjs";

export async function findByUserid(email) {
  return db
    .execute(
      "select user_idx, email, password, user_name, hope_job, created_at from members where email=?",
      [email]
    )
    .then((result) => {
      return result[0][0];
    });
}

export async function createUser(user) {
  const { email, password, userName } = user;
  console.log(user);
  return db
    .execute(
      "insert into members ( email, password, user_name) values (?, ?, ?)",
      [email, password, userName]
    )
    .then((result) => result[0].insertId);
}

// user_id로 사용자 조회
export async function findById(userIdx) {
  return db
    .execute(
      "select user_idx, email, user_name, hope_job, created_at from members where user_idx=?",
      [userIdx]
    )
    .then((result) => result[0][0]);
}

// 잔디에 로그인 활동 기록
// 같은 날 여러 번 로그인해도 한 번만 기록됨 (UNIQUE 제약조건으로 인해)
export async function recordLoginGrass(userIdx) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

  // INSERT 시도, 이미 기록이 있으면 UPDATE (is_login = 1로 설정)
  // 같은 날 두 번 로그인해도 안전하게 처리됨
  return db
    .execute(
      `INSERT INTO grass (grass_date, user_idx, is_login) 
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_login = 1`,
      [today, userIdx]
    )
    .then((result) => result[0]);
}
