import { Router } from 'express';
import * as roleController from '../controllers/role.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createRoleSchema, updateRoleSchema } from '../models/role.model.js';

const router = Router();

router.use(protect); // All role routes require authentication

router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.post('/', validate(createRoleSchema), roleController.create);
router.put('/:id', validate(updateRoleSchema), roleController.update);
router.delete('/:id', roleController.remove);

export default router;
