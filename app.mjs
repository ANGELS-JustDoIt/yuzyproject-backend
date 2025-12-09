import express from "express";
import authRouter from "./router/auth.mjs";
import { config } from "./config.mjs";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.listen(config.host.port);
