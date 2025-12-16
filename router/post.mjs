import express from "express";
import { isAuth } from "../middleware/auth.mjs";
import { uploadPostFiles } from "../middleware/upload.mjs";
import * as postController from "../controller/post.mjs";
import { body, validationResult } from "express-validator";
import multer from "multer";
import fs from "fs";

const router = express.Router();

const handleMulterError = (err, req, res, next) => {
  // 에러가 없으면 다음으로
  if (!err) {
    return next();
  }
  console.error("Multer error details:", {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  });
  console.error("Request details:", {
    method: req.method,
    url: req.url,
    contentType: req.headers["content-type"],
    hasFiles: !!req.files,
  });
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "파일 크기는 5MB를 초과할 수 없습니다." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ message: "최대 10개의 파일만 업로드 가능합니다." });
    }
    return res.status(400).json({ message: err.message });
  }
  // 파일 필터 에러 또는 multipart 파싱 에러
  if (
    err.message &&
    (err.message.includes("Malformed part header") ||
      err.message.includes("Unexpected end of form"))
  ) {
    return res.status(400).json({
      message:
        "잘못된 요청 형식입니다. multipart/form-data 형식으로 요청해주세요.",
      hint: "Postman에서 파일을 다시 선택해주세요. 파일 필드에 경고 아이콘이 있으면 파일이 제대로 첨부되지 않은 것입니다.",
    });
  }
  return res.status(400).json({ message: err.message });
};

const validatePostWithCleanup = [
  body("title").trim().notEmpty().withMessage("제목을 입력하세요"),
  body("type").trim().notEmpty().withMessage("타입을 입력하세요"),
  body("content").trim().isLength({ min: 4 }).withMessage("최소 4자이상 입력"),
  // 검증 후 에러가 있으면 파일 정리
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 검증 실패 시 업로드된 파일 삭제
      const allFiles = [];
      if (req.files) {
        if (req.files.mainImage) allFiles.push(...req.files.mainImage);
        if (req.files.files) allFiles.push(...req.files.files);
      }
      allFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];

// 포스트 업데이트 검증 (multipart/form-data용)
// type은 변경 불가이므로 검증에서 제외
const validateUpdateWithCleanup = [
  body("title").trim().notEmpty().withMessage("제목을 입력하세요"),
  body("content")
    .trim()
    .isLength({ min: 4 })
    .withMessage("내용은 최소 4자이상 입력"),
  // 검증 후 에러가 있으면 파일 정리
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // 검증 실패 시 업로드된 파일 삭제
      const allFiles = [];
      if (req.files) {
        if (req.files.mainImage) allFiles.push(...req.files.mainImage);
        if (req.files.files) allFiles.push(...req.files.files);
      }
      allFiles.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];

router.post(
  "/",
  isAuth, //login 검증 // request에 user_idx를 넣어줌.
  uploadPostFiles, // 실제 파일 올리기 (실제 사이트에 파일 올리는)
  handleMulterError, // 오류 점검
  validatePostWithCleanup, // formdata 검증
  postController.createPost // 파일 올리면 실제 db에 insert 해줌
);

// 포스트 업데이트 (파일 업로드 포함)
// multipart/form-data 형식으로 요청
// - title, content (필수) - type은 변경 불가
// - mainImage: 메인 이미지 파일 (선택, 단일 파일) - 새로 업로드하거나 기존 파일 교체
// - files: 첨부 파일들 (선택, 최대 10개) - 새로 추가할 파일들
router.put(
  "/:id",
  isAuth,
  uploadPostFiles,
  handleMulterError,
  validateUpdateWithCleanup,
  postController.updatePost
);

export default router;
