import { Router } from 'express';
import leadRoutes from './leadRoutes';
import dealRoutes from './dealRoutes';
import appointmentRoutes from './appointmentRoutes';
import userRoutes from './userRoutes';
import contactRoutes from './contactRoutes';
import noteRoutes from './noteRoutes';
import authRouter from "./authRoutes";
import groupRoutes from './groupRoutes';

const router = Router();

router.use('/leads', leadRoutes);
router.use('/deals', dealRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/users', userRoutes);
router.use('/contacts', contactRoutes);
router.use('/notes', noteRoutes);
router.use('/auth', authRouter);
router.use('/groups', groupRoutes);

router.get('/ping', (_req, res) => res.send('pong'));

export default router;
