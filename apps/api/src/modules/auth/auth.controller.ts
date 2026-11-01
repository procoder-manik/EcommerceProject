import type { Request, Response } from "express";
import { enqueuePasswordReset } from "../../jobs/email.job.js";
import {
  allowlistRefreshToken,
  createPasswordResetToken,
  issueTokenPair,
  registerUser,
  resetPasswordWithToken,
  rotateRefreshToken,
  revokeRefreshToken,
  validateCredentials,
} from "./auth.service.js";

function publicUser(user: { id?: string; name: string; email: string; role: string }) {
  return { id: String(user.id), name: user.name, email: user.email, role: user.role };
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const user = await registerUser(name, email, password);
  const tokens = issueTokenPair(user.id, user.role);
  await allowlistRefreshToken(user.id, tokens.refreshToken);
  res.status(201).json({ data: { user: publicUser(user), ...tokens } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Email or password is wrong" } });
  }
  const tokens = issueTokenPair(user.id, user.role);
  await allowlistRefreshToken(user.id, tokens.refreshToken);
  res.json({ data: { user: publicUser(user), ...tokens } });
}

export async function refresh(req: Request, res: Response) {
  const token = req.body.refreshToken ?? req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Missing refresh token" } });
  const tokens = await rotateRefreshToken(token);
  res.json({ data: tokens });
}

export async function logout(req: Request, res: Response) {
  const { userId, refreshToken } = req.body;
  if (userId && refreshToken) await revokeRefreshToken(userId, refreshToken);
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response) {
  const token = await createPasswordResetToken(req.body.email);
  if (token) await enqueuePasswordReset(req.body.email, token);
  // Same response whether or not the email exists — don't leak which emails are registered.
  res.json({ data: { message: "If that email exists, a reset link has been sent." } });
}

export async function resetPassword(req: Request, res: Response) {
  await resetPasswordWithToken(req.body.token, req.body.password);
  res.json({ data: { message: "Password updated. You can now log in." } });
}

export function googleOAuthStub(_req: Request, res: Response) {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message:
        "Google OAuth needs a registered OAuth client (GOOGLE_CLIENT_ID/SECRET). Wire up passport-google-oauth20 here once you have credentials — see ARCHITECTURE.md 'Authentication & Authorization'.",
    },
  });
}
