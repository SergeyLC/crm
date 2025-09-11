import { Router } from 'express';
import { 
  getAllPipelines, createPipeline, getPipeline,
  updatePipeline, deletePipeline
} from '../controllers/pipelineController';
import {
  assignUsersToPipeline, removeUserFromPipeline,
  removeUsersFromPipeline, // Neue Controller-Methode importieren
  assignGroupsToPipeline, removeGroupFromPipeline,
  removeGroupsFromPipeline // Neue Controller-Methode importieren
} from '../controllers/pipelineAssignmentController';
import { getUserPipelines } from '../controllers/userPipelineController';

const router = Router();

// Pipeline-Management
router.get('/', getAllPipelines);
router.post('/', createPipeline);
router.get('/:id',getPipeline);
router.put('/:id',updatePipeline);
router.delete('/:id', deletePipeline);

// Benutzer-Pipeline Zuweisungen
router.post('/:id/users', assignUsersToPipeline);
router.delete('/:id/users/:userId', removeUserFromPipeline);
// Neue Route für Bulk-Entfernen von Benutzern
router.post('/:id/users/remove', removeUsersFromPipeline);

// Gruppen-Pipeline Zuweisungen
router.post('/:id/groups', assignGroupsToPipeline);
router.delete('/:id/groups/:groupId', removeGroupFromPipeline);
// Neue Route für Bulk-Entfernen von Gruppen
router.post('/:id/groups/remove', removeGroupsFromPipeline);

// Benutzer-Dashboard
router.get("/user/:userId", getUserPipelines);

export default router;