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

// 글 번호(board_id)에 대한 포스트를 리턴 (user_name 포함)
export async function getById(boardId) {
  return db
    .execute(
      `select p.*, m.user_name 
       from posts p 
       left join members m on p.user_idx = m.user_idx 
       where p.board_id = ?`,
      [boardId]
    )
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

// 조회수 증가
export async function incrementViews(boardId) {
  return db.execute("update posts set views = views+ 1 where board_id = ?", [
    boardId,
  ]);
}

// 게시글 총 개수 (타입/키워드 적용)
export async function countPosts({ type, keyword }) {
  let sql = "select count(*) as total from posts";
  const params = [];
  const conditions = [];

  if (type) {
    conditions.push("type = ?");
    params.push(type);
  }

  if (keyword) {
    conditions.push("(title like ? or content like ?)");
    const like = `%${keyword}%`;
    params.push(like, like);
  }

  if (conditions.length > 0) {
    sql += " where " + conditions.join(" and ");
  }

  const [rows] = await db.execute(sql, params);
  return rows[0]?.total ?? 0;
}

// 게시글 목록 조회 (페이지네이션 + 타입/키워드 검색, user_name 포함)
export async function getPosts({ page = 1, limit = 10, type, keyword }) {
  const offset = (page - 1) * limit;
  let sql = `select p.*, m.user_name 
             from posts p 
             left join members m on p.user_idx = m.user_idx`;
  const params = [];
  const conditions = [];

  if (type) {
    conditions.push("p.type = ?");
    params.push(type);
  }

  if (keyword) {
    conditions.push("(p.title like ? or p.content like ?)");
    const like = `%${keyword}%`;
    params.push(like, like);
  }

  if (conditions.length > 0) {
    sql += " where " + conditions.join(" and ");
  }

  // MySQL 드라이버에서 limit/offset에 바인딩 파라미터를 사용할 때
  // 간헐적으로 `Incorrect arguments to mysqld_stmt_execute` 오류가 발생할 수 있어
  // 안전하게 숫자로 캐스팅 후 쿼리에 직접 삽입합니다.
  const safeLimit = Number(limit) || 10;
  const safeOffset = Number(offset) || 0;
  sql += ` order by p.board_id desc limit ${safeLimit} offset ${safeOffset}`;

  const [rows] = await db.execute(sql, params);

  return rows;
}

// 잔디에 게시글 작성 활동 기록
// 같은 날 여러 번 게시글을 작성해도 한 번만 기록됨 (UNIQUE 제약조건으로 인해)
export async function recordBoardGrass(userIdx) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

  // INSERT 시도, 이미 기록이 있으면 UPDATE (is_board = 1로 설정)
  // 같은 날 여러 게시글을 작성해도 안전하게 처리됨
  return db
    .execute(
      `INSERT INTO grass (grass_date, user_idx, is_board) 
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_board = 1`,
      [today, userIdx]
    )
    .then((result) => result[0]);
}

// 게시글 삭제 시, 해당 날짜에 더 이상 게시글이 없으면 잔디(is_board) 제거
export async function clearBoardGrassIfNoPostsOnDate(userIdx, targetDate) {
  // 해당 날짜에 사용자가 작성한 게시글 개수 조회
  const [rows] = await db.execute(
    "select count(*) as count from posts where user_idx = ? and date(created_at) = ?",
    [userIdx, targetDate]
  );
  const count = rows[0]?.count ?? 0;

  if (count === 0) {
    // 더 이상 해당 날짜의 게시글이 없으면 잔디 is_board를 0으로 초기화
    await db.execute(
      "update grass set is_board = 0 where user_idx = ? and grass_date = ?",
      [userIdx, targetDate]
    );
  }
}

// 게시글 삭제
export async function deleteById(boardId, userIdx) {
  return db.execute(
    "delete from posts where board_id = ? and user_idx = ?",
    [boardId, userIdx]
  );
}

// 게시글 해결 상태 업데이트 (답변 채택 시 사용)
export async function updateSolvedStatus(boardId, isSolved) {
  return db.execute(
    "update posts set is_solved = ? where board_id = ?",
    [isSolved ? 1 : 0, boardId]
  );
}
