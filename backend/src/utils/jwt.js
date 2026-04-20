import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

function createSignOptions(expiresIn) {
  return {
    expiresIn,
  };
}

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, createSignOptions(env.JWT_ACCESS_EXPIRES_IN));
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, createSignOptions(env.JWT_REFRESH_EXPIRES_IN));
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
