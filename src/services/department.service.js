import redis from '../config/redis.js';
import * as repo from '../repositories/department.repository.js';
import AppError from '../utils/AppError.js';

const CACHE_TTL = 300; // 5 minutes

export const getAllDepartments = async () => {
  const cacheKey = 'departments:all';
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching all departments`);
  const data = await repo.findAll();
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const getDepartmentById = async (id) => {
  const cacheKey = `departments:single:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching department ${id}`);
  const data = await repo.findById(id);
  const count = await repo.getEmployeeCount(id);
  const result = { ...data, employee_count: count };
  await redis.set(cacheKey, result, { ex: CACHE_TTL });
  return result;
};

export const createDepartment = async (payload) => {
  const data = await repo.create(payload);
  await redis.del('departments:all');
  console.log(`[CACHE INVALIDATED] Departments cache cleared`);
  return data;
};

export const updateDepartment = async (id, payload) => {
  const data = await repo.update(id, payload);
  await redis.del(`departments:single:${id}`);
  await redis.del('departments:all');
  console.log(`[CACHE INVALIDATED] Department ${id} cache cleared`);
  return data;
};

export const deleteDepartment = async (id) => {
  const count = await repo.getEmployeeCount(id);
  if (count > 0) {
    throw new AppError('Cannot delete department with active employees', 400);
  }
  await repo.delete_dept(id);
  await redis.del(`departments:single:${id}`);
  await redis.del('departments:all');
  console.log(`[CACHE INVALIDATED] Department ${id} cache cleared`);
};
