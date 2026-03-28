import supabase from '../config/supabase.js';
import AppError from '../utils/AppError.js';

const TABLE = 'employees';

export const findAll = async ({ page = 1, limit = 10 } = {}) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await supabase
    .from(TABLE)
    .select('*, departments(name), roles(title)', { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);
  if (error) throw new AppError(error.message, 500);
  return { data, count };
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, departments(name), roles(title)')
    .eq('id', id)
    .single();
  if (error) throw new AppError('Employee not found', 404);
  return data;
};

export const findByDepartment = async (deptId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*, roles(title)')
    .eq('department_id', deptId)
    .eq('is_active', true);
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const create = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select();
  if (error) throw new AppError(error.message, 500);
  return data[0];
};

export const update = async (id, payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error || !data.length) throw new AppError('Employee not found or update failed', 404);
  return data[0];
};

export const softDelete = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error || !data.length) throw new AppError('Employee not found', 404);
  return data[0];
};
