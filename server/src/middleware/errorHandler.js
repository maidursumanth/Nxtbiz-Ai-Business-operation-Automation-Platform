export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (err.name === 'ZodError' || err.name === 'ValidationError' || err.name === 'CastError') {
    status = 400;
  }
  if (err.code === 11000) {
    status = 409;
  }

  const body = {
    message: err.name === 'ZodError' ? 'Request validation failed' : err.message || 'Unexpected server error'
  };

  if (err.name === 'ZodError') {
    body.issues = err.issues;
  }

  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}
