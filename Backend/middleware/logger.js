// Server/middleware/logger.js
// Structured Request & Latency Logger

function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusCategory = Math.floor(status / 100);

    // Color indicators for console output
    const statusEmoji =
      statusCategory === 2 ? "[OK]" :
      statusCategory === 3 ? "[REDIRECT]" :
      statusCategory === 4 ? "[CLIENT ERR]" :
      "[SERVER ERR]";

    console.log(`[HTTP] ${timestamp} | ${req.method} ${req.originalUrl} | ${status} ${statusEmoji} | ${duration}ms`);
  });

  next();
}

module.exports = requestLogger;
