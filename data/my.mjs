import { db } from "../db/database.mjs";

// user_idx로 사용자 프로필 조회
export async function getUserProfile(userIdx) {
  return db
    .execute(
      "SELECT user_idx, email, user_name, hope_job, created_at FROM members WHERE user_idx = ?",
      [userIdx]
    )
    .then((result) => result[0][0]);
}

// 사용자 프로필 업데이트
export async function updateUserProfile(
  userIdx,
  { email, hope_job, password }
) {
  const updates = [];
  const values = [];

  if (email) {
    updates.push("email = ?");
    values.push(email);
  }
  if (hope_job !== undefined) {
    updates.push("hope_job = ?");
    values.push(hope_job);
  }
  if (password) {
    updates.push("password = ?");
    values.push(password);
  }

  if (updates.length === 0) {
    return getUserProfile(userIdx);
  }

  values.push(userIdx);
  const query = `UPDATE members SET ${updates.join(", ")} WHERE user_idx = ?`;

  await db.execute(query, values);
  return getUserProfile(userIdx);
}

// 사용자의 잔디 데이터 조회 (최근 365일)
export async function getGrassData(userIdx) {
  return db
    .execute(
      `SELECT g.grass_id, DATE_FORMAT(g.grass_date, '%Y-%m-%d') as grass_date, g.user_idx, m.user_name, g.is_login, g.is_code, g.is_board, g.is_reply 
       FROM grass g
       JOIN members m ON g.user_idx = m.user_idx
       WHERE g.user_idx = ? 
       ORDER BY g.grass_date DESC 
       LIMIT 365`,
      [userIdx]
    )
    .then((result) => result[0]);
}

// 사용자의 공부 아카이브 조회
export async function getStudyArchives(userIdx) {
  return db
    .execute(
      `SELECT sa.archive_id, sa.user_idx, m.user_name, sa.analysis_text, sa.raw_response, sa.created_at 
       FROM study_archive sa
       JOIN members m ON sa.user_idx = m.user_idx
       WHERE sa.user_idx = ? 
       ORDER BY sa.created_at DESC`,
      [userIdx]
    )
    .then((result) => result[0]);
}

// 공부 아카이브 이미지 조회
export async function getStudyArchiveImages(archiveId) {
  return db
    .execute(
      `SELECT archive_image_id, archive_id, image_url, created_at 
       FROM study_archive_img 
       WHERE archive_id = ? 
       ORDER BY created_at ASC`,
      [archiveId]
    )
    .then((result) => result[0]);
}

// 스크랩 생성
export async function createScrap(boardId, userIdx) {
  return db
    .execute("INSERT INTO scrap (board_id, user_idx) VALUES (?, ?)", [
      boardId,
      userIdx,
    ])
    .then((result) => getScrapById(result[0].insertId));
}

// 스크랩 ID로 조회
export async function getScrapById(scrapId) {
  return db
    .execute("SELECT * FROM scrap WHERE scrap_id = ?", [scrapId])
    .then((result) => result[0][0]);
}

// 스크랩 존재 여부 확인 (중복 체크용)
export async function getScrapByBoardAndUser(boardId, userIdx) {
  return db
    .execute("SELECT * FROM scrap WHERE board_id = ? AND user_idx = ?", [
      boardId,
      userIdx,
    ])
    .then((result) => result[0][0]);
}

// 스크랩 삭제
export async function deleteScrap(boardId, userIdx) {
  return db.execute(
    "DELETE FROM scrap WHERE board_id = ? AND user_idx = ?",
    [boardId, userIdx]
  );
}

// 사용자의 스크랩 조회
export async function getScraps(userIdx) {
  return db
    .execute(
      `SELECT 
        s.scrap_id, 
        s.board_id, 
        s.user_idx, 
        m.user_name, 
        s.created_at,
        p.title,
        p.type,
        p.content,
        p.user_idx as post_user_idx,
        p.views,
        p.is_solved,
        p.main_image_id,
        p.created_at as post_created_at,
        p.updated_at as post_updated_at,
        pm.user_name as post_user_name
       FROM scrap s
       JOIN members m ON s.user_idx = m.user_idx
       JOIN posts p ON s.board_id = p.board_id
       JOIN members pm ON p.user_idx = pm.user_idx
       WHERE s.user_idx = ? 
       ORDER BY s.created_at DESC`,
      [userIdx]
    )
    .then((result) => result[0]);
}

// 사용자의 알림 조회
export async function getNotifications(userIdx) {
  return db
    .execute(
      `SELECT n.noti_id, n.noti_type, n.noti_val, n.noti_content, n.read_yn, n.user_idx, m.user_name, n.created_at 
       FROM noti n
       JOIN members m ON n.user_idx = m.user_idx
       WHERE n.user_idx = ? 
       ORDER BY n.created_at DESC`,
      [userIdx]
    )
    .then((result) => result[0]);
}

// 알림을 읽음으로 표시
export async function markNotificationAsRead(notiId, userIdx) {
  return db
    .execute(`UPDATE noti SET read_yn = 1 WHERE noti_id = ? AND user_idx = ?`, [
      notiId,
      userIdx,
    ])
    .then((result) => result[0].affectedRows > 0);
}

// 알림 삭제
export async function deleteNotification(notiId, userIdx) {
  return db
    .execute(`DELETE FROM noti WHERE noti_id = ? AND user_idx = ?`, [
      notiId,
      userIdx,
    ])
    .then((result) => result[0].affectedRows > 0);
}

// 사용자 통계 조회 (조회수, 스크랩 수, 아카이브 수)
export async function getUserStats(userIdx) {
  const [scrapsResult] = await db.execute(
    `SELECT COUNT(*) as count FROM scrap WHERE user_idx = ?`,
    [userIdx]
  );
  const [archivesResult] = await db.execute(
    `SELECT COUNT(*) as count FROM study_archive WHERE user_idx = ?`,
    [userIdx]
  );
  const [viewsResult] = await db.execute(
    `SELECT SUM(views) as total_views FROM posts WHERE user_idx = ?`,
    [userIdx]
  );

  return {
    scrapsCount: scrapsResult[0].count || 0,
    archivesCount: archivesResult[0].count || 0,
    viewsCount: viewsResult[0].total_views || 0,
  };
}
