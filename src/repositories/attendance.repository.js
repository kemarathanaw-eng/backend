import supabase from '../config/supabase.js';
import AppError from '../utils/AppError.js';

const TABLE = 'attendance';

export const findAll = async ({ startDate, endDate, limit = 50, page = 1 }) => {
  let query = supabase.from(TABLE).select('*, employees(first_name, last_name, email)');

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) throw new AppError(error.message, 500);
  return { data, count };
};

export const findByEmployeeId = async (employeeId) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false });
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const checkIn = async (employeeId, date) => {
  // Check if record exists for today
  const { data: existing } = await supabase
    .from(TABLE)
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  if (existing) {
    // Update check_in
    const { data, error } = await supabase
      .from(TABLE)
      .update({ check_in: new Date().toISOString(), status: 'present' })
      .eq('id', existing.id)
      .select();
    if (error) throw new AppError(error.message, 500);
    return data[0];
  } else {
    // Create new record
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{
        employee_id: employeeId,
        date,
        check_in: new Date().toISOString(),
        status: 'present',
      }])
      .select();
    if (error) throw new AppError(error.message, 500);
    return data[0];
  }
};

export const checkOut = async (employeeId, date) => {
  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  if (selectError || !existing) throw new AppError('No check-in record found for today', 404);

  const checkOutTime = new Date();
  const checkInTime = new Date(existing.check_in);
  const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      check_out: checkOutTime.toISOString(),
      hours_worked: parseFloat(hoursWorked.toFixed(2)),
    })
    .eq('id', existing.id)
    .select();

  if (error) throw new AppError(error.message, 500);
  return data[0];
};

export const createLeaveRequest = async (payload) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert([payload])
    .select();
  if (error) throw new AppError(error.message, 500);
  return data[0];
};

export const getLeaveRequests = async (employeeId) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const updateLeaveRequest = async (id, payload) => {
  const { data, error } = await supabase
    .from('leave_requests')
    .update(payload)
    .eq('id', id)
    .select();
  if (error) throw new AppError(error.message, 500);
  return data[0];
};
