import { Router } from 'express';
import {
  initiatePayment,
  paymentCallback,
  getPaymentStatus,
} from '../controllers/mpesaController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/initiate', authMiddleware, initiatePayment);
router.post('/callback', paymentCallback);
router.get('/status/:mpesaRequestId', authMiddleware, getPaymentStatus);

export default router;

