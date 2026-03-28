import AppError from '../utils/AppError.js';

// Usage: router.post('/register', validate(registerSchema), authController.register)
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }
  next();
};

export default validate;
