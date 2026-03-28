import Joi from 'joi';

// Documents the Supabase 'employees' table schema
export const employeeFields = {
  id: 'uuid (auto)',
  first_name: 'string, required',
  last_name: 'string, required',
  email: 'string, unique, required',
  phone: 'string, optional',
  department_id: 'uuid → departments.id',
  role_id: 'uuid → roles.id',
  hire_date: 'date, required',
  salary: 'numeric, required',
  is_active: 'boolean, default true',
  created_at: 'timestamp (auto)',
  updated_at: 'timestamp (auto)',
};

// Joi validation schema for create
export const createEmployeeSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(60).required(),
  last_name: Joi.string().trim().min(2).max(60).required(),
  email: Joi.string().email().lowercase().required(),
  phone: Joi.string().optional(),
  department_id: Joi.string().uuid().required(),
  role_id: Joi.string().uuid().required(),
  hire_date: Joi.date().iso().required(),
  salary: Joi.number().positive().required(),
});

// Joi validation schema for update
export const updateEmployeeSchema = Joi.object({
  first_name: Joi.string().trim().min(2).max(60).optional(),
  last_name: Joi.string().trim().min(2).max(60).optional(),
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string().optional(),
  department_id: Joi.string().uuid().optional(),
  role_id: Joi.string().uuid().optional(),
  hire_date: Joi.date().iso().optional(),
  salary: Joi.number().positive().optional(),
});

// Auth schemas
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});
