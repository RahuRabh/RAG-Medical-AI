import type { Response } from "express";

import { env } from "../config/env.js";
import type { Request } from "express";
import { AppError } from "../utils/app-error.js";
import { durationToMs } from "../utils/duration.js";
import { login, logout, refreshSession, register } from "../services/auth.service.js";

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

function getRefreshCookieOptions() {
  const isProduction = env.NODE_ENV === "production";
  const sameSite: "lax" | "none" = isProduction ? "none" : "lax";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES_IN),
    path: "/",
  };
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshTokenCookie(res: Response) {
  const cookieOptions = getRefreshCookieOptions();

  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
  });
}

export async function registerController(req: Request, res: Response) {
  const result = await register(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(201).json({
    message: "Registration successful",
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function loginController(req: Request, res: Response) {
  const result = await login(req.body);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(200).json({
    message: "Login successful",
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  const result = await refreshSession(refreshToken);

  setRefreshTokenCookie(res, result.refreshToken);

  return res.status(200).json({
    message: "Token refreshed successfully",
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function logoutController(req: Request, res: Response) {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

  await logout(refreshToken);
  clearRefreshTokenCookie(res);

  return res.status(200).json({
    message: "Logout successful",
  });
}
