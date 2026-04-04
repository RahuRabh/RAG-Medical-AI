import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  email: string;
};

function createSignOptions(expiresIn: string): SignOptions {
  return {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };
}

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, createSignOptions(env.JWT_ACCESS_EXPIRES_IN));
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, createSignOptions(env.JWT_REFRESH_EXPIRES_IN));
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
