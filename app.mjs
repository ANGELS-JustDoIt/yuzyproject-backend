import express from "express";
import path from "path";
import authRouter from "./router/auth.mjs";
import { config } from "./config.mjs";
import postRouter from "./router/post.mjs";
import myRouter from "./router/my.mjs";

const app = express();

// CORS 설정 - 프론트엔드와의 통신을 위해 필요
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 개발 환경에서는 모든 origin 허용
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // OPTIONS 요청 처리 (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// 업로드된 파일(이미지 등) 정적 서빙
// 실제 파일 경로: 프로젝트 루트의 uploads 디렉터리
// 예: http://localhost:8080/uploads/1765680275595-84573369.png
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// app.use(express.json());   이 서버 전체를 json 전체로 통신하려고 했으나, 게시글에서는 form data를 사용하므로 주석

app.use("/auth", express.json());
app.use("/my", express.json());

app.use("/post", postRouter);
app.use("/auth", authRouter);
app.use("/my", myRouter);

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.listen(config.host.port);
