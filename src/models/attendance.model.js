import Joi from 'joi';

// Documents the Supabase 'attendance' table schema
export const attendanceFields = {
  id: 'uuid (auto)',
  employee_id: 'uuid → employees.id',
  date: 'date, required',
  check_in: 'timestamptz, optional',
  check_out: 'timestamptz, optional',
  hours_worked: 'numeric, optional',
  status: "text check (status in ('present','absent','half-day','leave'))",
};

// Joi validation schema for check-in
export const checkInSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.date().iso().optional(),
});

// Joi validation schema for check-out
export const checkOutSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.date().iso().optional(),
});

// Joi validation schema for leave request
export const leaveRequestSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  reason: Joi.string().optional(),
});
