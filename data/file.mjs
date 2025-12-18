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

// board_id로 파일 삭제
export async function deleteFilesByBoardId(boardType, boardId) {
  return db.execute(
    "delete from file where board_type = ? and board_id = ?",
    [boardType, boardId]
  );
}

// 파일 ID로 파일 조회
export async function getById(fileKey) {
  return db
    .execute("select * from file where file_key = ?", [fileKey])
    .then((result) => result[0][0]);
}

// 파일 ID로 파일 삭제
export async function deleteById(fileKey) {
  return db.execute("delete from file where file_key = ?", [fileKey]);
}

// 여러 파일 ID로 파일 삭제
export async function deleteByIds(fileKeys) {
  if (!fileKeys || fileKeys.length === 0) {
    return { affectedRows: 0 };
  }
  const placeholders = fileKeys.map(() => "?").join(",");
  return db.execute(
    `delete from file where file_key in (${placeholders})`,
    fileKeys
  );
}



