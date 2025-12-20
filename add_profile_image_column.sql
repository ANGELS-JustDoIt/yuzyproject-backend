-- members 테이블에 profile_image_url 컬럼 추가
ALTER TABLE members 
ADD COLUMN profile_image_url VARCHAR(500) NULL 
AFTER hope_job;

