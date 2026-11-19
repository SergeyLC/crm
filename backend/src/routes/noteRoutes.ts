import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const requireAdmin = authorizeRoles('ADMIN');

router.use(authenticateToken);

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', requireAdmin, deleteNote);

export default router;
