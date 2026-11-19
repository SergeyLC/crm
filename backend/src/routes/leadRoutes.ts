import { Router } from 'express';
import * as leadController from '../controllers/leadController';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();
const requireAdmin = authorizeRoles('ADMIN');

router.use(authenticateToken);

router.post('/', leadController.createLead);
router.get('/', leadController.getAllLeads);
router.get('/archived', leadController.getArchivedLeads);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.delete('/:id', requireAdmin, leadController.deleteLead);

export default router;
