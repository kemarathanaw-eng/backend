import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHandler.js';
import * as employeeService from '../services/employee.service.js';

export const getAll = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await employeeService.getAllEmployees(page, limit);
  sendSuccess(res, result, 'Employees retrieved');
});

export const getById = catchAsync(async (req, res) => {
  const data = await employeeService.getEmployeeById(req.params.id);
  sendSuccess(res, data, 'Employee retrieved');
});

export const getByDepartment = catchAsync(async (req, res) => {
  const data = await employeeService.getEmployeesByDepartment(req.params.deptId);
  sendSuccess(res, data, 'Employees in department retrieved');
});

export const create = catchAsync(async (req, res) => {
  const data = await employeeService.createEmployee(req.body);
  sendSuccess(res, data, 'Employee created', 201);
});

export const update = catchAsync(async (req, res) => {
  const data = await employeeService.updateEmployee(req.params.id, req.body);
  sendSuccess(res, data, 'Employee updated');
});

export const remove = catchAsync(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id);
  sendSuccess(res, null, 'Employee deactivated');
});
