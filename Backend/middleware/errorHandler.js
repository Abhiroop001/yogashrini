// Server/middleware/errorHandler.js
// Centralized 404 & Global Error Handling Middleware

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
    status: 404,
    timestamp: new Date().toISOString()
  });
}

function globalErrorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: `Invalid identifier format: '${err.value}' for field '${err.path}'`,
      status: 400
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: "Validation failed: " + messages.join(", "),
      status: 400
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication token.",
      status: 401
    });
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected server error occurred.",
    status: statusCode,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
  });
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
