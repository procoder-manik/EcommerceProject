import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { redis } from "../../config/redis.js";
import { User } from "../users/user.model.js";

function httpError(status: number, code: string, message: string) {
  return Object.assign(new Error(message), { status, code });
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) throw httpError(409, "EMAIL_TAKEN", "An account with this email already exists");
  const passwordHash = await bcrypt.hash(password, 12);
  return User.create({ name, email, passwordHash, role: "customer" });
}

export async function validateCredentials(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function issueTokenPair(userId: string, role: "customer" | "admin") {
  const accessToken = jwt.sign({ id: userId, role }, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl as jwt.SignOptions["expiresIn"] });
  const refreshToken = jwt.sign({ id: userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshTtl as jwt.SignOptions["expiresIn"] });
  return { accessToken, refreshToken };
}

// Refresh tokens are allow-listed in Redis so a specific session can be
// revoked (password change, "log out everywhere") — something a bare,
// stateless JWT can't do on its own.
export async function allowlistRefreshToken(userId: string, token: string) {
  await redis.set(`refresh:${userId}:${token}`, "1", "EX", 60 * 60 * 24 * 30);
}

export async function isRefreshTokenAllowed(userId: string, token: string) {
  return (await redis.get(`refresh:${userId}:${token}`)) !== null;
}

export async function revokeRefreshToken(userId: string, token: string) {
  await redis.del(`refresh:${userId}:${token}`);
}

export async function rotateRefreshToken(oldToken: string) {
  let payload: { id: string };
  try {
    payload = jwt.verify(oldToken, env.jwt.refreshSecret) as { id: string };
  } catch {
    throw httpError(401, "INVALID_TOKEN", "Refresh token is invalid or expired");
  }

  const allowed = await isRefreshTokenAllowed(payload.id, oldToken);
  if (!allowed) throw httpError(401, "INVALID_TOKEN", "Refresh token has been revoked");

  // Rotate on every use: the old token can never be replayed again.
  await revokeRefreshToken(payload.id, oldToken);

  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, "INVALID_TOKEN", "User no longer exists");

  const tokens = issueTokenPair(user.id, user.role);
  await allowlistRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

export async function createPasswordResetToken(email: string) {
  const user = await User.findOne({ email });
  if (!user) return null; // caller must not reveal whether the email exists
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(`pwreset:${token}`, String(user.id), "EX", 60 * 15);
  return token;
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const userId = await redis.get(`pwreset:${token}`);
  if (!userId) throw httpError(400, "INVALID_TOKEN", "This reset link is invalid or has expired");
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(userId, { passwordHash });
  await redis.del(`pwreset:${token}`);
}
