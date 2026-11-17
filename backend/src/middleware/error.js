export const notFound = (req, _res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  if (err.code === 11000) { status = 409; message = `Duplicate value for: ${Object.keys(err.keyPattern || {}).join(', ')}`; }
  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (status === 500 && process.env.NODE_ENV === 'production') message = 'Something went wrong';
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message, ...(err.details && { details: err.details }) });
};
