import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';

const router = Router();
const usersController = new UsersController();

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.patch('/:id/role', usersController.updateRole);
router.delete('/:id', usersController.delete);

export default router;
