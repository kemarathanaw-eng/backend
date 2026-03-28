import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHandler.js';
import * as attendanceService from '../services/attendance.service.js';

export const getAll = catchAsync(async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const result = await attendanceService.getAttendanceRecords(startDate, endDate, page, limit);
  sendSuccess(res, result, 'Attendance records retrieved');
});

export const getByEmployeeId = catchAsync(async (req, res) => {
  const data = await attendanceService.getEmployeeAttendance(req.params.id);
  sendSuccess(res, data, 'Employee attendance retrieved');
});

export const checkIn = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const data = await attendanceService.checkIn(req.body.employee_id, today);
  sendSuccess(res, data, 'Check-in recorded', 201);
});

export const checkOut = catchAsync(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const data = await attendanceService.checkOut(req.body.employee_id, today);
  sendSuccess(res, data, 'Check-out recorded');
});

export const submitLeaveRequest = catchAsync(async (req, res) => {
  const data = await attendanceService.submitLeaveRequest(req.body);
  sendSuccess(res, data, 'Leave request submitted', 201);
});

export const getLeaveHistory = catchAsync(async (req, res) => {
  const data = await attendanceService.getEmployeeLeaveHistory(req.params.id);
  sendSuccess(res, data, 'Leave history retrieved');
});

export const approveLeaveRequest = catchAsync(async (req, res) => {
  const { status } = req.body;
  const data = await attendanceService.approveLeaveRequest(req.params.id, status);
  sendSuccess(res, data, `Leave request ${status}`);
});
