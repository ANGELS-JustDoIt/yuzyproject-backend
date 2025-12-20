import express from "express";
import { isAuth } from "../middleware/auth.mjs";
import { uploadProfileImage } from "../middleware/upload.mjs";
import * as myController from "../controller/my.mjs";
import * as scheduleController from "../controller/schedule.mjs";
import { body } from "express-validator";
import { validate } from "../middleware/validator.mjs";

const router = express.Router();

// 모든 라우트는 인증이 필요함
router.use(isAuth);

// 프로필 업데이트 검증
const validateProfileUpdate = [
  body("user_name").optional().trim().isLength({ min: 1, max: 100 }).withMessage("닉네임은 1-100자 사이여야 합니다"),
  body("hope_job").optional().trim(),
  body("password")
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage("비밀번호 최소 8자 이상 입력"),
  validate,
];

// GET /my/profile - 사용자 프로필 및 통계 조회
router.get("/profile", myController.getProfile);

// PUT /my/profile - 사용자 프로필 업데이트 (텍스트 + 프로필 이미지)
// Content-Type: multipart/form-data
// 필드:
// - email (optional)
// - hope_job (optional)
// - password (optional)
// - profileImage (optional, file)
router.put(
  "/profile",
  uploadProfileImage,
  validateProfileUpdate,
  myController.updateProfile
);

// GET /my/grass - 잔디/활동 데이터 조회
router.get("/grass", myController.getGrass);

// POST /my/scraps/:id - 스크랩 토글 (추가/취소)
router.post("/scraps/:id", myController.toggleScrap);

// GET /my/scraps - 스크랩 조회
router.get("/scraps", myController.getScraps);

// GET /my/notifications - 알림 조회
router.get("/notifications", myController.getNotifications);

// PATCH /my/notifications/:id/read - 알림을 읽음으로 표시
router.patch("/notifications/:id/read", myController.markNotificationRead);

// DELETE /my/notifications/:id - 알림 삭제
router.delete("/notifications/:id", myController.deleteNotification);

// 일정 등록 검증
const validateSchedule = [
  body("title").trim().notEmpty().withMessage("제목을 입력하세요"),
  body("scheduleDate")
    .trim()
    .notEmpty()
    .withMessage("일정 날짜를 입력하세요")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"),
  body("description").optional().trim(),
  validate,
];

// POST /my/schedule - 일정 등록
router.post("/schedule", validateSchedule, scheduleController.createSchedule);

// GET /my/schedule - 일정 조회
// Query parameters:
// - startDate, endDate: 날짜 범위 조회 (YYYY-MM-DD)
// - 없으면: 전체 조회
router.get("/schedule", scheduleController.getSchedules);

// PUT /my/schedule/:id - 일정 수정
router.put(
  "/schedule/:id",
  validateSchedule,
  scheduleController.updateSchedule
);

// DELETE /my/schedule/:id - 일정 삭제
router.delete("/schedule/:id", scheduleController.deleteSchedule);

// GET /my/archives - 공부 아카이브 조회
router.get("/archives", myController.getArchives);

// 코드 분석 결과 저장 검증
const validateArchive = [
  body("rawResponse")
    .notEmpty()
    .withMessage("분석 결과(rawResponse)는 필수입니다."),
  body("analysisText").optional().trim(),
  validate,
];

// POST /my/archive - 코드 분석 결과 저장
router.post("/archive", validateArchive, myController.createArchive);

export default router;
