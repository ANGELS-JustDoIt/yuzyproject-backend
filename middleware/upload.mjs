import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp_originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
// 파일 필터 (모든 파일 타입 허용)
const fileFilter = (req, file, cb) => {
  // 모든 파일 타입 허용
  cb(null, true);
};
// Multer 설정
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    fieldSize: 10 * 1024 * 1024, // 10MB for non-file fields
  },
  fileFilter: fileFilter,
  preservePath: false,
});
// 단일 파일 업로드
export const uploadSingle = upload.single("file");

// 프로필 이미지 업로드 (필드명: profileImage)
export const uploadProfileImage = upload.single("profileImage");
// 여러 파일 업로드 (files 배열)
export const uploadFiles = upload.array("files", 10); // 최대 10개
// 메인 이미지와 첨부 파일 모두 처리
export const uploadPostFiles = upload.fields([
  { name: "mainImage", maxCount: 1 }, // 메인 이미지 (단일 파일)
  { name: "files", maxCount: 10 }, // 첨부 파일들 (최대 10개)
]);
