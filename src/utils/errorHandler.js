import AppError from './AppError.js';

// Handle Supabase-specific errors
const handleSupabaseError = (err) => {
  if (err.code === '23505') return new AppError('Duplicate value — record already exists.', 409);
  if (err.code === '23503') return new AppError('Related record not found (foreign key).', 400);
  return new AppError('Database error.', 500);
};

// Handle JWT errors
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpired = () => new AppError('Token expired. Please log in again.', 401);

const sendErrorDev = (err, res) => res.status(err.statusCode).json({
  success: false,
  status: err.status,
  message: err.message,
  stack: err.stack,
});

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({ success: false, message: err.message });
  } else {
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpired();
    if (err.code?.startsWith('23')) error = handleSupabaseError(err);
    sendErrorProd(error, res);
  }
};
