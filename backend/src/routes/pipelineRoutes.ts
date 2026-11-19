import { Router } from 'express';
import { 
  getAllPipelines, createPipeline, getPipeline,
  updatePipeline, deletePipeline
} from '../controllers/pipelineController';
import {
  assignUsersToPipeline, removeUserFromPipeline,
  removeUsersFromPipeline,
  assignGroupsToPipeline, removeGroupFromPipeline,
  removeGroupsFromPipeline
} from '../controllers/pipelineAssignmentController';
import { getUserPipelines } from '../controllers/userPipelineController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const requireAdmin = authorizeRoles('ADMIN');

router.use(authenticateToken);

// Pipeline-Management
router.get('/', getAllPipelines);
router.post('/', requireAdmin, createPipeline);
router.get('/:id', getPipeline);
router.put('/:id', requireAdmin, updatePipeline);
router.delete('/:id', requireAdmin, deletePipeline);

// Benutzer-Pipeline Zuweisungen
router.post('/:id/users', requireAdmin, assignUsersToPipeline);
router.delete('/:id/users/:userId', requireAdmin, removeUserFromPipeline);
router.post('/:id/users/remove', requireAdmin, removeUsersFromPipeline);

// Gruppen-Pipeline Zuweisungen
router.post('/:id/groups', requireAdmin, assignGroupsToPipeline);
router.delete('/:id/groups/:groupId', requireAdmin, removeGroupFromPipeline);
router.post('/:id/groups/remove', requireAdmin, removeGroupsFromPipeline);

// Benutzer-Dashboard
router.get("/user/:userId", getUserPipelines);

export default router;
