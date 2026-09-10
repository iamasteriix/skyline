import type { NextFunction, Request, Response } from 'express';
import { ErrorCodes } from './constants.js';
import { AppError } from './exceptions.js';
import { logger } from '@/config/index.js';


/**
 * Express error handling middleware that processes errors and sends appropriate HTTP responses.
 */
export const onError = (
  error: unknown,
  request: Request,
  response: Response,
  _: NextFunction,
): void => {

  if (error instanceof AppError) {
    request.log?.error(
      { error: error, },
      error.message,
    );

    response.status(error.statusCode).json({
      error: {
        code: ErrorCodes.internal.code,
        message: ErrorCodes.internal.message,
      },
    });
    return;
  }
  
  logger.error({ err: error }, ErrorCodes.unexpected.message);

  response.status(500).json({
    error: {
      code: ErrorCodes.internal.code,
      message: ErrorCodes.internal.message,
    },
  });
  return;
}
