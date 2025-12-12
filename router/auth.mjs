import express from "express";
import { validate } from "../middleware/validator.mjs";
import * as authController from "../controller/auth.mjs";
import { body } from "express-validator";

const router = express.Router();

const validateLogin = [
  body("userid")
    .trim()
    .isLength({ min: 6 })
    .withMessage("아이디 최소 6자이상 입력")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("아이디에 특수문자는 사용 불가"),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("비밀번호 최소 8자 이상 입력"),
  validate,
];

const validateSignup = [
  ...validateLogin,
  body("name").trim().notEmpty().withMessage("name을 입력"),
  body("email").trim().isEmail().withMessage("이메일 형식 확인"),
  validate, // validate 두번 써도 상관 없다
];

// 회원가입
// http://127.0.0.1:8080/auth/signup  // 검증 / 로직 처리
router.post("/signup", validateSignup, authController.signup);

// 로그인
router.post("/login", validateLogin, authController.login);

export default router;
