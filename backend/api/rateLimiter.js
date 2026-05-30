const rateLimit = require('express-rate-limit');

// Limiter for authentication routes (login, forgot-password, reset-password)
// Limits each IP to 15 requests per 15 minutes to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Limit each IP to 15 requests per windowMs
  message: {
    error: 'Terlahu banyak percobaan masuk dari alamat IP ini. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
  authRateLimiter
};
