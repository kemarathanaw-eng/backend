import Joi from 'joi';

// Documents the Supabase 'departments' table schema
export const departmentFields = {
  id: 'uuid (auto)',
  name: 'text, unique, required',
  description: 'text, optional',
  manager_id: 'uuid → employees.id, optional',
  created_at: 'timestamp (auto)',
  updated_at: 'timestamp (auto)',
};

// Joi validation schema for create
export const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().optional(),
  manager_id: Joi.string().uuid().optional(),
});

// Joi validation schema for update
export const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().optional(),
  manager_id: Joi.string().uuid().optional(),
});
