const jwt = require('jsonwebtoken');

module.exports  = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ If no Authorization header is provided
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Please pass Authorization token',
    });
  }

  // commit
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Proceed to next middleware or route
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};
