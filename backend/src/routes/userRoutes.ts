import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  blockUser,
  unblockUser
} from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const requireAdmin = authorizeRoles('ADMIN');

router.use(authenticateToken);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

// User status management routes
router.patch('/:id/status', requireAdmin, updateUserStatus);
router.patch('/:id/block', requireAdmin, blockUser);
router.patch('/:id/unblock', requireAdmin, unblockUser);

export default router;
