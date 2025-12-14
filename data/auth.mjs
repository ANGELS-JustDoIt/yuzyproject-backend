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
