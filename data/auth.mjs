import { db } from "../db/database.mjs";

export async function findByUserid(userid) {
  return db
    .execute("select id, user_id, password from users where user_id=?", [
      userid,
    ])
    .then((result) => {
      console.log(result);
      return result[0][0];
    });
}

export async function createUser(user) {
  const { userid, password, name, email, url } = user;
  return db
    .execute(
      "insert into users (user_id, password, name, email, url) values (?, ?, ?, ?, ?)",
      [userid, password, name, email, url]
    )
    .then((result) => result[0].insertId);
}
