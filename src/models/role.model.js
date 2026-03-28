import Joi from 'joi';

// Documents the Supabase 'roles' table schema
export const roleFields = {
  id: 'uuid (auto)',
  title: 'text, required',
  department_id: 'uuid → departments.id, optional',
  min_salary: 'numeric, optional',
  max_salary: 'numeric, optional',
  level: "text check (level in ('Junior','Mid','Senior','Lead'))",
  created_at: 'timestamp (auto)',
  updated_at: 'timestamp (auto)',
};

// Joi validation schema for create
export const createRoleSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  department_id: Joi.string().uuid().optional(),
  min_salary: Joi.number().optional(),
  max_salary: Joi.number().optional(),
  level: Joi.string().valid('Junior', 'Mid', 'Senior', 'Lead').optional(),
});

// Joi validation schema for update
export const updateRoleSchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).optional(),
  department_id: Joi.string().uuid().optional(),
  min_salary: Joi.number().optional(),
  max_salary: Joi.number().optional(),
  level: Joi.string().valid('Junior', 'Mid', 'Senior', 'Lead').optional(),
});
