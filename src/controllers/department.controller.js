import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHandler.js';
import * as departmentService from '../services/department.service.js';

export const getAll = catchAsync(async (req, res) => {
  const data = await departmentService.getAllDepartments();
  sendSuccess(res, data, 'Departments retrieved');
});

export const getById = catchAsync(async (req, res) => {
  const data = await departmentService.getDepartmentById(req.params.id);
  sendSuccess(res, data, 'Department retrieved');
});

export const create = catchAsync(async (req, res) => {
  const data = await departmentService.createDepartment(req.body);
  sendSuccess(res, data, 'Department created', 201);
});

export const update = catchAsync(async (req, res) => {
  const data = await departmentService.updateDepartment(req.params.id, req.body);
  sendSuccess(res, data, 'Department updated');
});

export const remove = catchAsync(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  sendSuccess(res, null, 'Department deleted');
});
