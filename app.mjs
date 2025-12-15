import express from "express";
import authRouter from "./router/auth.mjs";
import { config } from "./config.mjs";
import postRouter from "./router/post.mjs";
import myRouter from "./router/my.mjs";

const app = express();

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
