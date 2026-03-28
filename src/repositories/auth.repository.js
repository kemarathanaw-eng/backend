import supabase from '../config/supabase.js';
import AppError from '../utils/AppError.js';

const TABLE = 'users';

export const findByEmail = async (email) => {
  const { data } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .single();
  return data; // returns null if not found — no throw
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new AppError('User not found', 404);
  return data;
};

export const createUser = async (payload) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select();
  if (error) throw new AppError(error.message, 500);
  return data[0];
};

export const updatePassword = async (id, hashedPassword) => {
  const { error } = await supabase
    .from(TABLE)
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new AppError(error.message, 500);
};
