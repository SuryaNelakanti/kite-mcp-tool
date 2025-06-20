import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';
import HttpError from '../utils/http-error.js';

export const validate = <T>(schema: ZodSchema<T>) => (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const data = schema.parse(req.body);
    req.body = data as unknown as Request['body'];
    next();
  } catch (err) {
    console.info(err);
    next(new HttpError(400, 'invalid_request'));
  }
};

export default validate;
