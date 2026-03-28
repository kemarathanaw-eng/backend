import redis from '../config/redis.js';
import * as repo from '../repositories/role.repository.js';
import AppError from '../utils/AppError.js';

const CACHE_TTL = 300; // 5 minutes

export const getAllRoles = async () => {
  const cacheKey = 'roles:all';
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching all roles`);
  const data = await repo.findAll();
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const getRoleById = async (id) => {
  const cacheKey = `roles:single:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  console.log(`[DB QUERY] Fetching role ${id}`);
  const data = await repo.findById(id);
  await redis.set(cacheKey, data, { ex: CACHE_TTL });
  return data;
};

export const createRole = async (payload) => {
  const data = await repo.create(payload);
  await redis.del('roles:all');
  console.log(`[CACHE INVALIDATED] Roles cache cleared`);
  return data;
};

export const updateRole = async (id, payload) => {
  const data = await repo.update(id, payload);
  await redis.del(`roles:single:${id}`);
  await redis.del('roles:all');
  console.log(`[CACHE INVALIDATED] Role ${id} cache cleared`);
  return data;
};

export const deleteRole = async (id) => {
  const count = await repo.getEmployeeCount(id);
  if (count > 0) {
    throw new AppError('Cannot delete role with assigned employees', 400);
  }
  await repo.delete_role(id);
  await redis.del(`roles:single:${id}`);
  await redis.del('roles:all');
  console.log(`[CACHE INVALIDATED] Role ${id} cache cleared`);
};
