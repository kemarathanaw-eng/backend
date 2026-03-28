import supabase from '../config/supabase.js';
import AppError from '../utils/AppError.js';

const TABLE = 'roles';

export const findAll = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*');
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new AppError('Role not found', 404);
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
  if (error || !data.length) throw new AppError('Role not found or update failed', 404);
  return data[0];
};

export const delete_role = async (id) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  if (error) throw new AppError('Failed to delete role', 500);
};

export const getEmployeeCount = async (roleId) => {
  const { count, error } = await supabase
    .from('employees')
    .select('*', { count: 'exact' })
    .eq('role_id', roleId)
    .eq('is_active', true);
  if (error) throw new AppError(error.message, 500);
  return count;
};
