import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status ?? 500;
  const body: any = {
    error: {
      code: err.code ?? "INTERNAL_ERROR",
      message: status < 500 ? err.message : "Something went wrong",
    },
  };
  if (env.nodeEnv !== "production") body.error.stack = err.stack;
  res.status(status).json(body);
}
