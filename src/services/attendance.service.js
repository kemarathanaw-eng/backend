import redis from '../config/redis.js';
import * as repo from '../repositories/attendance.repository.js';

const CACHE_TTL = 300; // 5 minutes

export const getAttendanceRecords = async (startDate, endDate, page, limit) => {
  const cacheKey = `attendance:list:${startDate}:${endDate}:${page}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching attendance records`);
  const result = await repo.findAll({ startDate, endDate, page, limit });
  await redis.set(cacheKey, result, { ex: CACHE_TTL });
  return result;
};

export const getEmployeeAttendance = async (employeeId) => {
  const cacheKey = `attendance:emp:${employeeId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching attendance for employee ${employeeId}`);
  const data = await repo.findByEmployeeId(employeeId);
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const checkIn = async (employeeId, date) => {
  const data = await repo.checkIn(employeeId, date);
  // Invalidate related caches
  await redis.del(`attendance:emp:${employeeId}`);
  const { keys } = await redis.scan(0, { match: 'attendance:list:*', count: 100 });
  if (keys.length) await redis.del(...keys);
  console.log(`[CACHE INVALIDATED] Attendance caches cleared`);
  return data;
};

export const checkOut = async (employeeId, date) => {
  const data = await repo.checkOut(employeeId, date);
  // Invalidate related caches
  await redis.del(`attendance:emp:${employeeId}`);
  const { keys } = await redis.scan(0, { match: 'attendance:list:*', count: 100 });
  if (keys.length) await redis.del(...keys);
  console.log(`[CACHE INVALIDATED] Attendance caches cleared`);
  return data;
};

export const submitLeaveRequest = async (payload) => {
  const data = await repo.createLeaveRequest({
    ...payload,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  // Invalidate related caches
  await redis.del(`leave:emp:${payload.employee_id}`);
  console.log(`[CACHE INVALIDATED] Leave request caches cleared`);
  return data;
};

export const getEmployeeLeaveHistory = async (employeeId) => {
  const cacheKey = `leave:emp:${employeeId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching leave history for employee ${employeeId}`);
  const data = await repo.getLeaveRequests(employeeId);
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const approveLeaveRequest = async (leaveId, status) => {
  const data = await repo.updateLeaveRequest(leaveId, {
    status,
    updated_at: new Date().toISOString(),
  });
  // Invalidate all leave caches
  const { keys } = await redis.scan(0, { match: 'leave:*', count: 100 });
  if (keys.length) await redis.del(...keys);
  console.log(`[CACHE INVALIDATED] Leave request caches cleared`);
  return data;
};
