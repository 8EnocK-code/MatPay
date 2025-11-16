import { Router } from 'express';
import {
  createTripHandler,
  confirmTripHandler,
  getTripsHandler,
  getTripHandler,
} from '../controllers/tripController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', roleMiddleware('conductor'), createTripHandler);
router.get('/', getTripsHandler);
router.get('/:tripId', getTripHandler);
router.post('/:tripId/confirm', roleMiddleware('driver', 'owner'), confirmTripHandler);

export default router;

