// Server/middleware/security.js
// Custom Security Headers & Request Sanitization (Zero External Dependency)

function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  
  // Protect against clickjacking
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  
  // Enable XSS filtering
  res.setHeader("X-XSS-Protection", "1; mode=block");
  
  // Cross-Origin Resource Policy (allow cross-origin assets like images and videos)
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  
  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Remove X-Powered-By header to avoid fingerprinting
  res.removeHeader("X-Powered-By");

  next();
}

module.exports = securityHeaders;
