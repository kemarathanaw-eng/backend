import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../models/employee.model.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/change-password', protect, authController.changePassword);

export default router;
