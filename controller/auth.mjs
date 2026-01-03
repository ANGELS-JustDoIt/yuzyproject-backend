import * as authRepository from "../data/auth.mjs";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config.mjs";

/**
 * JWT 토큰 생성 함수
 * 사용자 인덱스를 기반으로 JWT 토큰을 생성합니다.
 * @param {number} user_idx - 사용자 고유 인덱스
 * @returns {string} 생성된 JWT 토큰
 */
async function createJwtToken(user_idx) {
  // jwt.sign()을 사용하여 토큰 생성
  // payload: { user_idx } - 토큰에 포함될 사용자 정보
  // secretKey: 서버에서만 알고 있는 비밀키로 토큰 서명
  // expiresIn: 토큰의 만료 시간 설정
  return jwt.sign({ user_idx }, config.jwt.secretKey, {
    expiresIn: config.jwt.expiresInSec,
  });
}

export async function signup(req, res, next) {
  const { email, password, userName } = req.body;

  const found = await authRepository.findByUserid(email);
  if (found) {
    return res.status(409).json({
      message: `${email}는 이미 사용중인 e-mail 입니다.`,
    });
  }

  const hashed = bcrypt.hashSync(password, config.bcrypt.saltRounds);
  const user = await authRepository.createUser({
    email,
    password: hashed,
    userName,
  });

  //   const user = await authRepository.createUser(userid, password, name, email);
  const token = await createJwtToken(user.id);
  console.log(token);
  res.status(201).json({ token, user });
}
/**
 * 로그인 처리 함수
 * 사용자의 이메일과 비밀번호를 검증하고, 성공 시 JWT 토큰을 발급합니다.
 * @param {Object} req - 요청 객체 (body: { email, password })
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export async function login(req, res, next) {
  // 1. 요청에서 이메일과 비밀번호 추출
  const { email, password } = req.body;
  
  // 2. 이메일로 사용자 조회
  const user = await authRepository.findByUserid(email);
  if (!user) {
    return res.status(401).json({ message: `${email} 를 찾을 수 없음` });
  }
  
  // 3. 비밀번호 검증 (bcrypt를 사용하여 해시된 비밀번호와 비교)
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: `아이디 또는 비밀번호 확인` });
  }

  // 4. 인증 성공 시 JWT 토큰 생성
  const token = await createJwtToken(user.user_idx);

  // 5. 잔디에 로그인 활동 기록 (선택적 기능)
  try {
    await authRepository.recordLoginGrass(user.user_idx);
  } catch (grassError) {
    // 잔디 기록 실패해도 로그인은 성공 처리
    console.error("잔디 기록 에러:", grassError);
  }

  // 6. 토큰과 사용자 정보를 클라이언트에 반환
  console.log(user);
  res.status(200).json({ token, user });
}
