import { Router } from 'express';
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  addMembersBatch,
  removeMembersBatch,
  replaceMembersBatch,
  getGroupMembers
} from '../controllers/groupController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const requireAdmin = authorizeRoles('ADMIN');

router.use(authenticateToken, requireAdmin);

router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

// Group members
router.get('/:id/members', getGroupMembers);
router.post('/:groupId/members', addUserToGroup);
router.delete('/:groupId/members/:userId', removeUserFromGroup);
router.post('/:groupId/members/batch', addMembersBatch);
router.put('/:groupId/members/batch', replaceMembersBatch);
router.delete('/:groupId/members/batch', removeMembersBatch);

export default router;
