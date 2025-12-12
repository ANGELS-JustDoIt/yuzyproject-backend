import * as authRepository from "../data/auth.mjs";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config.mjs";

async function createJwtToken(idx) {
  return jwt.sign({ idx }, config.jwt.secretKey, {
    expiresIn: config.jwt.expiresInSec,
  });
}

export async function signup(req, res, next) {
  const { userid, password, name, email, url } = req.body;

  const found = await authRepository.findByUserid(userid);
  if (found) {
    return res.status(409).json({
      message: `${userid}는 이미 사용중인 아이디이므로 사용할 수 없습니다`,
    });
  }

  const hashed = bcrypt.hashSync(password, config.bcrypt.saltRounds);
  const user = await authRepository.createUser({
    userid,
    password: hashed,
    name,
    email,
    url,
  });

  //   const user = await authRepository.createUser(userid, password, name, email);
  const token = await createJwtToken(user.id);
  console.log(token);
  res.status(201).json({ token, user });
}
export async function login(req, res, next) {
  const { userid, password } = req.body;
  const user = await authRepository.findByUserid(userid);
  if (!user) {
    res.status(401).json(`${userid} 를 찾을 수 없음`);
  }
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ message: `아이디 또는 비밀번호 확인` });
  }

  const token = await createJwtToken(user.user_id);
  res.status(200).json({ token, user });
}
