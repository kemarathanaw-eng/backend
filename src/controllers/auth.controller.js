import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHandler.js';
import * as authService from '../services/auth.service.js';

export const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  sendSuccess(res, user, 'Account created successfully', 201);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 'Login successful');
});

export const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, req.user, 'User profile');
});

export const logout = catchAsync(async (req, res) => {
  await authService.logout(req.token);
  sendSuccess(res, null, 'Logged out successfully');
});

export const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  sendSuccess(res, null, 'Password updated successfully');
});
