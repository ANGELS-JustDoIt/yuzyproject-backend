import jwt from "jsonwebtoken";
import * as authRepository from "../data/auth.mjs";
import { config } from "../config.mjs";

const AUTH_ERROR = { message: "인증 에러" };

export const isAuth = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  console.log(authHeader);

  // postman에 authorization의 bearer 토큰이 없으면 error,
  //authHeader가 bearer가 둘다 존재 해야함.

  // if (!(authHeader && authHeader.startsWith("Bearer "))) {

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("헤더 에러");
    return res.status(401).json(AUTH_ERROR);
  }
  // Authorization:Bearer QEWRASDFDSAFSADFASDFD==
  // authHeader에 공백으로 스플릿 하면 bearer 가 0번, q ~ 가 1번
  //그 토큰을 jwt라는 라이브러리에서 검증해라 . secretKey를 이용해서 토큰을 검증해라.
  // 실패하면 에러, **콜백함수 (async (error,decoded))  verify가 실행된 이후에 실행.

  const token = authHeader.split(" ")[1];
  // console.log("토큰 분리 성공", token);
  jwt.verify(token, config.jwt.secretKey, async (error, decoded) => {
    if (error) {
      console.log("토큰 에러");
      return res.status(401).json(AUTH_ERROR);
    }
    console.log(decoded);
    const user = await authRepository.findById(decoded.user_idx);
    if (!user) {
      console.log("아이디 없음");
      return res.status(401).json(AUTH_ERROR);
    }
    req.user_idx = user.user_idx;
    req.userIdx = user.user_idx;
    next();
  });
};
