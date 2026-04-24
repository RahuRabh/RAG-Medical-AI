import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";

const allowedOrigins = new Set([env.CLIENT_URL]);

function isAllowedOrigin(origin) {
  return (
    allowedOrigins.has(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

export function createApp() {
  const app = express();

  app.use(
    cors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/test", (_req, res) => {
  res.send("working");
});
  app.use("/api", apiRouter);

  return app;
}
