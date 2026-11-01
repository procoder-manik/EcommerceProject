import type { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 doesn't forward rejected promises to the error handler on its
// own — every async controller in this app is wrapped with this so a
// thrown/rejected error reaches errorHandler instead of hanging the request.
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
