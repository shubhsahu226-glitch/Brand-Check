class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}

function createError(status, code, message) {
  return new AppError(status, code, message);
}

function notFoundHandler(req, res) {
  return res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl || req.url}`,
    },
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle explicit AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    const message =
      err.issues && err.issues[0] ? err.issues[0].message : 'Validation failed';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
  }

  // Handle body-parser JSON parse error
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload',
      },
    });
  }

  // Unexpected server error
  if (req.log) {
    req.log.error(err);
  } else {
    console.error(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'Internal server error'
        : err.message || 'Internal server error',
    },
  });
}

module.exports = {
  AppError,
  createError,
  notFoundHandler,
  errorHandler,
};
