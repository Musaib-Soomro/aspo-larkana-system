function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'A record with these details already exists.' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced record does not exist.' });
  }

  const status = err.status || 500;
  const message = err.expose ? err.message : 'An unexpected server error occurred.';
  res.status(status).json({ success: false, error: message });
}

module.exports = errorHandler;
