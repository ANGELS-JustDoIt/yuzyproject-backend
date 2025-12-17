-- 외래키 생성 DDL
-- 게시글 삭제 시 관련 데이터를 CASCADE로 자동 삭제하기 위한 외래키 설정

-- 1. posts 테이블 외래키
-- posts.user_idx -> members.user_idx (사용자 삭제 시 게시글도 삭제)
ALTER TABLE posts
ADD CONSTRAINT fk_posts_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- posts.main_image_id -> file.file_key (파일 삭제 시 NULL로 설정)
ALTER TABLE posts
ADD CONSTRAINT fk_posts_main_image_id
FOREIGN KEY (main_image_id) REFERENCES file(file_key)
ON DELETE SET NULL;

-- 2. comments 테이블 외래키
-- comments.board_id -> posts.board_id (게시글 삭제 시 댓글도 삭제)
ALTER TABLE comments
ADD CONSTRAINT fk_comments_board_id
FOREIGN KEY (board_id) REFERENCES posts(board_id)
ON DELETE CASCADE;

-- comments.user_idx -> members.user_idx (사용자 삭제 시 댓글도 삭제)
ALTER TABLE comments
ADD CONSTRAINT fk_comments_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 3. likes 테이블 외래키
-- likes.user_idx -> members.user_idx (사용자 삭제 시 좋아요도 삭제)
ALTER TABLE likes
ADD CONSTRAINT fk_likes_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 주의: likes.board_id는 board_type에 따라 다른 테이블을 참조할 수 있으므로
-- 외래키를 추가하지 않습니다. 대신 트리거를 사용하거나 애플리케이션 레벨에서 처리합니다.
-- (아래 트리거 섹션 참조)

-- 4. file 테이블 외래키
-- file.user_idx -> members.user_idx (사용자 삭제 시 파일도 삭제)
ALTER TABLE file
ADD CONSTRAINT fk_file_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 주의: file.board_id는 board_type에 따라 다른 테이블을 참조할 수 있으므로
-- 외래키를 추가하지 않습니다. 대신 트리거를 사용하거나 애플리케이션 레벨에서 처리합니다.
-- (아래 트리거 섹션 참조)

-- 5. keyword 테이블 외래키
-- keyword.board_id -> posts.board_id (게시글 삭제 시 키워드도 삭제)
ALTER TABLE keyword
ADD CONSTRAINT fk_keyword_board_id
FOREIGN KEY (board_id) REFERENCES posts(board_id)
ON DELETE CASCADE;

-- 6. scrap 테이블 외래키
-- scrap.board_id -> posts.board_id (게시글 삭제 시 스크랩도 삭제)
ALTER TABLE scrap
ADD CONSTRAINT fk_scrap_board_id
FOREIGN KEY (board_id) REFERENCES posts(board_id)
ON DELETE CASCADE;

-- scrap.user_idx -> members.user_idx (사용자 삭제 시 스크랩도 삭제)
ALTER TABLE scrap
ADD CONSTRAINT fk_scrap_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 7. noti 테이블 외래키
-- noti.user_idx -> members.user_idx (사용자 삭제 시 알림도 삭제)
ALTER TABLE noti
ADD CONSTRAINT fk_noti_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 8. grass 테이블 외래키
-- grass.user_idx -> members.user_idx (사용자 삭제 시 잔디 기록도 삭제)
ALTER TABLE grass
ADD CONSTRAINT fk_grass_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 9. study_archive 테이블 외래키
-- study_archive.user_idx -> members.user_idx (사용자 삭제 시 아카이브도 삭제)
ALTER TABLE study_archive
ADD CONSTRAINT fk_study_archive_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- 10. study_archive_img 테이블 외래키
-- study_archive_img.archive_id -> study_archive.archive_id (아카이브 삭제 시 이미지도 삭제)
ALTER TABLE study_archive_img
ADD CONSTRAINT fk_study_archive_img_archive_id
FOREIGN KEY (archive_id) REFERENCES study_archive(archive_id)
ON DELETE CASCADE;

-- 11. schedule 테이블 외래키
-- schedule.user_idx -> members.user_idx (사용자 삭제 시 일정도 삭제)
ALTER TABLE schedule
ADD CONSTRAINT fk_schedule_user_idx
FOREIGN KEY (user_idx) REFERENCES members(user_idx)
ON DELETE CASCADE;

-- ============================================
-- 트리거: 게시글 삭제 시 likes와 file 자동 삭제
-- ============================================
-- likes와 file 테이블은 board_type에 따라 다른 테이블을 참조할 수 있으므로
-- 외래키 대신 트리거를 사용하여 board_type='post'인 경우만 삭제합니다.

DELIMITER $$

-- 게시글 삭제 시 likes에서 board_type='post'인 레코드만 삭제
CREATE TRIGGER trg_delete_post_likes
AFTER DELETE ON posts
FOR EACH ROW
BEGIN
  DELETE FROM likes 
  WHERE board_type = 'post' AND board_id = OLD.board_id;
END$$

-- 게시글 삭제 시 file에서 board_type='post'인 레코드만 삭제
CREATE TRIGGER trg_delete_post_files
AFTER DELETE ON posts
FOR EACH ROW
BEGIN
  DELETE FROM file 
  WHERE board_type = 'post' AND board_id = OLD.board_id;
END$$

DELIMITER ;

-- ============================================
-- 주의사항:
-- ============================================
-- 1. likes와 file 테이블의 board_id는 board_type에 따라 다른 테이블을 참조할 수 있습니다.
--    MySQL은 조건부 외래키를 지원하지 않으므로, 트리거를 사용하여 처리합니다.
--
-- 2. 트리거를 사용하면 게시글 삭제 시 board_type='post'인 likes와 file만 자동 삭제됩니다.
--    다른 board_type의 데이터는 영향을 받지 않습니다.
--
-- 3. 외래키를 추가하기 전에 기존 데이터의 무결성을 확인해야 합니다.
--    참조 무결성 위반이 있는 경우 외래키 추가가 실패할 수 있습니다.
--
-- 4. 외래키와 트리거 추가 후에는 게시글 삭제 시 관련 데이터가 자동으로 CASCADE 삭제됩니다.
--    따라서 controller/post.mjs의 deletePost 함수에서 수동으로 파일, 댓글, 좋아요를
--    삭제하는 코드는 제거하거나 선택적으로 유지할 수 있습니다.
--    (파일 시스템에서 파일 삭제는 여전히 필요합니다)
