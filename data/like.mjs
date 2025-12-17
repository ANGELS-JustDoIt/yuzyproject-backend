import { db } from "../db/database.mjs";

// 좋아요 추가
export async function createLike(boardType, boardId, userIdx) {
  return db
    .execute(
      "insert into likes (board_type, board_id, user_idx) values (?, ?, ?)",
      [boardType, boardId, userIdx]
    )
    .then((result) => result[0]);
}

// 좋아요 삭제
export async function deleteLike(boardType, boardId, userIdx) {
  return db.execute(
    "delete from likes where board_type = ? and board_id = ? and user_idx = ?",
    [boardType, boardId, userIdx]
  );
}

// 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
export async function getLikeByUser(boardType, boardId, userIdx) {
  return db
    .execute(
      "select * from likes where board_type = ? and board_id = ? and user_idx = ?",
      [boardType, boardId, userIdx]
    )
    .then((result) => result[0][0]);
}

// 게시글의 좋아요 개수 조회
export async function getLikeCount(boardType, boardId) {
  return db
    .execute(
      "select count(*) as count from likes where board_type = ? and board_id = ?",
      [boardType, boardId]
    )
    .then((result) => result[0][0]?.count ?? 0);
}

// 여러 게시글의 좋아요 개수를 한 번에 조회 (board_id 배열)
export async function getLikeCountsByBoardIds(boardType, boardIds) {
  if (!boardIds || boardIds.length === 0) {
    return {};
  }

  const placeholders = boardIds.map(() => "?").join(",");
  const [rows] = await db.execute(
    `select board_id, count(*) as count 
     from likes 
     where board_type = ? and board_id in (${placeholders})
     group by board_id`,
    [boardType, ...boardIds]
  );

  // board_id를 키로 하는 객체로 변환
  const likeCounts = {};
  rows.forEach((row) => {
    likeCounts[row.board_id] = row.count;
  });

  // 좋아요가 없는 게시글도 0으로 설정
  boardIds.forEach((boardId) => {
    if (!(boardId in likeCounts)) {
      likeCounts[boardId] = 0;
    }
  });

  return likeCounts;
}
