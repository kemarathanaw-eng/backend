import redis from '../config/redis.js';
import * as repo from '../repositories/employee.repository.js';

const CACHE_TTL = 300; // 5 minutes

// ── Helpers ──────────────────────────────────────────────────────────
const invalidateListCache = async () => {
  // Upstash scan to clear all paginated list keys
  const { keys } = await redis.scan(0, { match: 'employees:list:*', count: 100 });
  if (keys.length) await redis.del(...keys);
};

// ── Service methods ───────────────────────────────────────────────────
export const getAllEmployees = async (page, limit) => {
  const cacheKey = `employees:list:${page}:${limit}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached; // Upstash returns parsed JSON
  }
  console.log(`[DB QUERY] Fetching employees list`);
  const result = await repo.findAll({ page, limit });
  await redis.set(cacheKey, result, { ex: CACHE_TTL });
  return result;
};

export const getEmployeeById = async (id) => {
  const cacheKey = `employees:single:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching employee ${id}`);
  const data = await repo.findById(id);
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const getEmployeesByDepartment = async (deptId) => {
  const cacheKey = `employees:dept:${deptId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching employees for department ${deptId}`);
  const data = await repo.findByDepartment(deptId);
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const createEmployee = async (payload) => {
  const data = await repo.create(payload);
  await invalidateListCache();
  console.log(`[CACHE INVALIDATED] Employee list cache cleared`);
  return data;
};

export const updateEmployee = async (id, payload) => {
  const data = await repo.update(id, payload);
  await redis.del(`employees:single:${id}`);
  await invalidateListCache();
  console.log(`[CACHE INVALIDATED] Employee ${id} cache cleared`);
  return data;
};

export const deleteEmployee = async (id) => {
  const data = await repo.softDelete(id);
  await redis.del(`employees:single:${id}`);
  await invalidateListCache();
  console.log(`[CACHE INVALIDATED] Employee ${id} cache cleared`);
  return data;
};
