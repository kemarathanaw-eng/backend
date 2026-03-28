import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import * as authRepo from '../repositories/auth.repository.js';
import AppError from '../utils/AppError.js';

export const register = async ({ name, email, password }) => {
  const exists = await authRepo.findByEmail(email);
  if (exists) throw new AppError('Email already registered.', 409);
  const hashed = await bcrypt.hash(password, 12);
  const user = await authRepo.createUser({ name, email, password: hashed });
  const { password: _, ...safeUser } = user; // strip password from response
  return safeUser;
};

export const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password.', 401);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid email or password.', 401);
  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
  return { token };
};

export const logout = async (token) => {
  const decoded = jwt.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.set(`bl_${token}`, '1', { ex: ttl });
};

export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await authRepo.findById(userId);
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw new AppError('Current password is incorrect.', 401);
  const hashed = await bcrypt.hash(newPassword, 12);
  await authRepo.updatePassword(userId, hashed);
};
