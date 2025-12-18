import { db } from "../db/database.mjs";

// 댓글 작성
export async function create(boardId, reply, userIdx, seq = 0) {
  return db
    .execute(
      "insert into comments (board_id, reply, user_idx, seq) values (?, ?, ?, ?)",
      [boardId, reply, userIdx, seq]
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
export async function update(replyId, reply, userIdx) {
  return db
    .execute(
      "update comments set reply = ?, updated_at = now() where reply_id = ? and user_idx = ?",
      [reply, replyId, userIdx]
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
  const result = await db.execute(
    "update comments set is_selected = 1 where reply_id = ? and board_id = ?",
    [replyId, boardId]
  );
  
  // 업데이트가 성공했는지 확인
  if (result[0].affectedRows === 0) {
    throw new Error("댓글 채택에 실패했습니다. 댓글이 존재하지 않거나 이미 채택되었을 수 있습니다.");
  }
  
  return getById(replyId);
}

// 댓글 삭제 시, 해당 날짜에 더 이상 댓글이 없으면 잔디(is_reply) 제거
export async function clearReplyGrassIfNoCommentsOnDate(userIdx, targetDate) {
  // 해당 날짜에 사용자가 작성한 댓글 개수 조회
  const [rows] = await db.execute(
    "select count(*) as count from comments where user_idx = ? and date(created_at) = ?",
    [userIdx, targetDate]
  );
  const count = rows[0]?.count ?? 0;

  if (count === 0) {
    // 더 이상 해당 날짜의 댓글이 없으면 잔디 is_reply를 0으로 초기화
    await db.execute(
      "update grass set is_reply = 0 where user_idx = ? and grass_date = ?",
      [userIdx, targetDate]
    );
  }
}

