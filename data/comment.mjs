import { db } from "../db/database.mjs";

// 댓글 작성
export async function create(boardId, content, userIdx, seq = 0) {
  return db
    .execute(
      "insert into comments (board_id, content, user_idx, seq) values (?, ?, ?, ?)",
      [boardId, content, userIdx, seq]
    )
    .then((result) => getById(result[0].insertId));
}

// 댓글 ID로 조회
export async function getById(replyId) {
  return db
    .execute("select * from comments where reply_id = ?", [replyId])
    .then((result) => result[0][0]);
}

// 게시글의 모든 댓글 조회 (seq 순서대로)
export async function getByBoardId(boardId) {
  return db
    .execute(
      "select * from comments where board_id = ? order by seq asc, reply_id asc",
      [boardId]
    )
    .then((result) => result[0]);
}

// 댓글 수정
export async function update(replyId, content, userIdx) {
  return db
    .execute(
      "update comments set content = ?, updated_at = now() where reply_id = ? and user_idx = ?",
      [content, replyId, userIdx]
    )
    .then(() => getById(replyId));
}

// 댓글 삭제
export async function deleteById(replyId, userIdx) {
  return db.execute(
    "delete from comments where reply_id = ? and user_idx = ?",
    [replyId, userIdx]
  );
}

// 게시글의 댓글 개수 조회
export async function countByBoardId(boardId) {
  return db
    .execute(
      "select count(*) as count from comments where board_id = ?",
      [boardId]
    )
    .then((result) => result[0][0]?.count ?? 0);
}

// 게시글의 최대 seq 값 조회 (새 댓글 추가 시 사용)
export async function getMaxSeqByBoardId(boardId) {
  return db
    .execute(
      "select coalesce(max(seq), -1) as maxSeq from comments where board_id = ?",
      [boardId]
    )
    .then((result) => result[0][0]?.maxSeq ?? -1);
}

// 댓글 채택 (is_selected = 1)
export async function selectComment(replyId, boardId, userIdx) {
  // 게시글 작성자만 채택할 수 있도록 검증은 컨트롤러에서 처리
  return db
    .execute(
      "update comments set is_selected = 1 where reply_id = ? and board_id = ?",
      [replyId, boardId]
    )
    .then(() => getById(replyId));
}

