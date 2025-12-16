import express from "express";
import { isAuth } from "../middleware/auth.mjs";
import * as scheduleController from "../controller/schedule.mjs";
import { body, validationResult } from "express-validator";

const router = express.Router();

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
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];

// 일정 등록
router.post("/", isAuth, validateSchedule, scheduleController.createSchedule);

// 일정 조회
// Query parameters:
// - date: 특정 날짜 조회 (YYYY-MM-DD)
// - startDate, endDate: 날짜 범위 조회 (YYYY-MM-DD)
// - 없으면: 전체 조회
router.get("/", isAuth, scheduleController.getSchedules);

export default router;
