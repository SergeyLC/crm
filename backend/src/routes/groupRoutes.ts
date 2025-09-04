import { Router } from 'express';
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  getGroupMembers
} from '../controllers/groupController';

const router = Router();

router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

// Group members
router.get('/:id/members', getGroupMembers);
router.post('/:groupId/members', addUserToGroup);
router.delete('/:groupId/members/:userId', removeUserFromGroup);

export default router;
