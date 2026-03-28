import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { leaveRequestSchema } from '../models/attendance.model.js';

const router = Router();

router.use(protect); // All leave routes require authentication

router.post('/', validate(leaveRequestSchema), attendanceController.submitLeaveRequest);
router.get('/employee/:id', attendanceController.getLeaveHistory);
router.put('/:id', attendanceController.approveLeaveRequest);

export default router;
