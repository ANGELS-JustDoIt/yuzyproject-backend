import express from "express";
import { isAuth } from "../middleware/auth.mjs";
import * as myController from "../controller/my.mjs";
import * as scheduleController from "../controller/schedule.mjs";
import { body } from "express-validator";
import { validate } from "../middleware/validator.mjs";

const router = express.Router();

// 모든 라우트는 인증이 필요함
router.use(isAuth);

// 프로필 업데이트 검증
const validateProfileUpdate = [
  body("email").optional().trim().isEmail().withMessage("이메일 형식 확인"),
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

// PUT /my/profile - 사용자 프로필 업데이트
router.put("/profile", validateProfileUpdate, myController.updateProfile);

// GET /my/grass - 잔디/활동 데이터 조회
router.get("/grass", myController.getGrass);

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

export default router;
