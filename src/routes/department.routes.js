import { Router } from 'express';
import * as departmentController from '../controllers/department.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../models/department.model.js';

const router = Router();

router.use(protect); // All department routes require authentication

router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);
router.post('/', validate(createDepartmentSchema), departmentController.create);
router.put('/:id', validate(updateDepartmentSchema), departmentController.update);
router.delete('/:id', departmentController.remove);

export default router;
