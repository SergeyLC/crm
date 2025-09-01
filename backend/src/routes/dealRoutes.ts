import { Router } from 'express';
import * as dealController from '../controllers/dealController';

const router = Router();

router.post('/', dealController.createDeal);
router.get('/', dealController.getAllDeals);
router.get('/active', dealController.getActiveDeals);
router.get('/archived', dealController.getArchivedDeals);
router.get('/won', dealController.getWonDeals);
router.get('/lost', dealController.getLostDeals);
router.get("/:id", dealController.getDealById);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

export default router;