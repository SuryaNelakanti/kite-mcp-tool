import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/http-error.js';
import logger from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.status, message: err.message } });
    return;
  }
  logger.error(err);
  res.status(500).json({ error: { code: 500, message: 'internal_error' } });
};

export default errorHandler;
