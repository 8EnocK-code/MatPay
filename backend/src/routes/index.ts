import { Router } from 'express';
import authRoutes from './auth';
import tripRoutes from './trips';
import mpesaRoutes from './mpesa';
import routeRoutes from './routes';
import matatuRoutes from './matatus';
import userRoutes from './users';
import revenueRoutes from './revenue';
import paymentsRoutes from './paymentsRoutes';
import ownerRoutes from './ownerRoutes';
import analyticsRoutes from './analyticsRoutes';
import walletRoutes from './walletRoutes';
import ownerWithdrawalsRoutes from './ownerWithdrawalsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/mpesa', mpesaRoutes);
router.use('/routes', routeRoutes);
router.use('/matatus', matatuRoutes);
router.use('/users', userRoutes);
router.use('/revenue', revenueRoutes);
router.use('/pay', paymentsRoutes);
router.use('/owner/users', ownerRoutes);
router.use('/owner', analyticsRoutes);
router.use('/wallet', walletRoutes);
router.use('/owner/withdrawals', ownerWithdrawalsRoutes);

export default router;

