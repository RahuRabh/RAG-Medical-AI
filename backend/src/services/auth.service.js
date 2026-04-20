import bcrypt from "bcrypt";

import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { durationToMs } from "../utils/duration.js";
import { sha256 } from "../utils/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createSession(user) {
  const payload = {
    sub: user.id,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = sha256(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
}

async function revokeSessionByToken(refreshToken) {
  const refreshTokenHash = sha256(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function register(input) {
  const email = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  const tokens = await createSession(user);

  return {
    user: toSafeUser(user),
    ...tokens,
  };
}

export async function login(input) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  await prisma.refreshToken.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  const tokens = await createSession(user);

  return {
    user: toSafeUser(user),
    ...tokens,
  };
}

export async function refreshSession(refreshToken) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const refreshTokenHash = sha256(refreshToken);
  const storedSession = await prisma.refreshToken.findUnique({
    where: {
      tokenHash: refreshTokenHash,
    },
  });

  if (!storedSession || storedSession.revokedAt || storedSession.expiresAt <= new Date()) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await revokeSessionByToken(refreshToken);

  const tokens = await createSession(user);

  return {
    user: toSafeUser(user),
    ...tokens,
  };
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return;
  }

  await revokeSessionByToken(refreshToken);
}
