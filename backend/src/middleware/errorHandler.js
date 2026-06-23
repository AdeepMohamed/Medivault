const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, { stack: err.stack, url: req.url, method: req.method });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large. Maximum size is 50MB.' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
