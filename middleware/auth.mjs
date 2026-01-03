import jwt from "jsonwebtoken";
import * as authRepository from "../data/auth.mjs";
import { config } from "../config.mjs";

const AUTH_ERROR = { message: "인증 에러" };

/**
 * 인증 미들웨어 함수
 * 요청 헤더에서 JWT 토큰을 추출하고 검증하여 사용자 인증을 수행합니다.
 * 인증이 성공하면 req.userIdx에 사용자 인덱스를 설정하고 다음 미들웨어로 진행합니다.
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
export const isAuth = async (req, res, next) => {
  // 1. Authorization 헤더에서 토큰 추출
  // 형식: "Authorization: Bearer <토큰>"
  const authHeader = req.get("Authorization");
  console.log(authHeader);

  // 2. Authorization 헤더 존재 여부 및 Bearer 형식 검증
  // Bearer 토큰 형식이 아니면 인증 에러 반환
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("헤더 에러");
    return res.status(401).json(AUTH_ERROR);
  }
  
  // 3. Bearer 접두사 제거하고 실제 토큰만 추출
  // "Bearer <토큰>" 형식에서 공백으로 분리하여 토큰 부분만 가져옴
  const token = authHeader.split(" ")[1];
  
  // 4. JWT 토큰 검증
  // jwt.verify()를 사용하여 토큰의 유효성과 서명을 확인
  // secretKey를 사용하여 토큰이 서버에서 발급한 것인지 검증
  jwt.verify(token, config.jwt.secretKey, async (error, decoded) => {
    // 4-1. 토큰 검증 실패 시 (만료, 변조, 형식 오류 등)
    if (error) {
      console.log("토큰 에러");
      return res.status(401).json(AUTH_ERROR);
    }
    
    // 4-2. 토큰에서 디코딩된 사용자 정보 확인
    console.log(decoded);
    
    // 5. 토큰에 포함된 user_idx로 사용자 존재 여부 확인
    const user = await authRepository.findById(decoded.user_idx);
    if (!user) {
      console.log("아이디 없음");
      return res.status(401).json(AUTH_ERROR);
    }
    
    // 6. 인증 성공: 요청 객체에 사용자 인덱스 저장
    // 이후 라우터 핸들러에서 req.userIdx로 접근 가능
    req.userIdx = user.user_idx;
    
    // 7. 다음 미들웨어 또는 라우터 핸들러로 진행
    next();
  });
};
