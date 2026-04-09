const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Get token from Authorization header or from request query
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ error: 'Token expired.' });
      }
      return res.status(403).json({ error: 'Invalid token.' });
    }
    
    // Attach the user payload to the request object
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
