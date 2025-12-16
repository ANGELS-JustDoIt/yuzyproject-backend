import { db } from "../db/database.mjs";

// 파일 저장
export async function createFile(
  boardType,
  boardId,
  filePath,
  fileName,
  userId,
  seq = 0
) {
  return db
    .execute(
      "insert into file (board_type, board_id, file_path, file_name, seq, user_idx) values (?, ?, ?, ?, ?, ?)",
      [boardType, boardId, filePath, fileName, seq, userId]
    )
    .then((result) => result[0].insertId);
}

// board_id로 파일 목록 조회
export async function getFilesByBoardId(boardType, boardId) {
  return db
    .execute(
      "select * from file where board_type = ? and board_id = ? order by seq",
      [boardType, boardId]
    )
    .then((result) => result[0]);
}



