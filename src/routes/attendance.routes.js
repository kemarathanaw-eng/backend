import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { checkInSchema, checkOutSchema, leaveRequestSchema } from '../models/attendance.model.js';

const router = Router();

router.use(protect); // All attendance routes require authentication

// Attendance routes
router.get('/', attendanceController.getAll);
router.get('/employee/:id', attendanceController.getByEmployeeId);
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);

// Leave routes
router.post('/leave', validate(leaveRequestSchema), attendanceController.submitLeaveRequest);
router.get('/leave/employee/:id', attendanceController.getLeaveHistory);
router.put('/leave/:id', attendanceController.approveLeaveRequest);

export default router;
