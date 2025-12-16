import { db } from "../db/database.mjs";

// 포스트를 작성
export async function create(
  title,
  type,
  content,
  userIdx,
  mainImageId = null
) {
  return db
    .execute(
      "insert into posts (title, type, content, user_idx, main_image_id) values (?, ?, ?, ?, ?)",
      [title, type, content, userIdx, mainImageId]
    )
    .then((result) => getById(result[0].insertId));
}

// 글 번호(board_id)에 대한 포스트를 리턴
export async function getById(boardId) {
  return db
    .execute("select * from posts where board_id = ?", [boardId])
    .then((result) => result[0][0]);
}

// 포스트 업데이트 (type은 변경 불가)
export async function update(boardId, title, content, userId) {
  return db
    .execute(
      "update posts set title = ?, content = ?, updated_at = now() where board_id = ? and user_idx = ?",
      [title, content, boardId, userId]
    )
    .then(() => getById(boardId));
}

// 메인 이미지 업데이트
export async function updateMainImage(boardId, mainImageId) {
  return db.execute("update posts set main_image_id = ? where board_id = ?", [
    mainImageId,
    boardId,
  ]);
}
