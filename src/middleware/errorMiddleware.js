/**
 * 404 Not Found Middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl} not found`,
  });
}

/**
 * Global Error Handler Middleware
 */
export function globalErrorHandler(err, req, res, next) {
  console.error('💥 Unhandled Server Error:', err);

  // Multer-specific errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Uploaded file exceeds the maximum allowed size.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target || 'field'} already exists.`,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
