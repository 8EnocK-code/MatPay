import { Request, Response } from 'express';
import {
  createTrip,
  confirmTrip,
  getTripsByUser,
  getTripById,
} from '../services/tripService';

export async function createTripHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { routeId, matatuId, driverId, fareType } = req.body;

    if (!routeId || !matatuId || !driverId || !fareType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (req.user.role !== 'conductor') {
      res.status(403).json({ error: 'Only conductors can create trips' });
      return;
    }

    const trip = await createTrip({
      routeId,
      matatuId,
      conductorId: req.user.id,
      driverId,
      fareType,
    });

    res.status(201).json(trip);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function confirmTripHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tripId } = req.params;

    if (!tripId) {
      res.status(400).json({ error: 'Trip ID is required' });
      return;
    }

    const trip = await confirmTrip({
      tripId,
      userId: req.user.id,
      role: req.user.role,
    });

    res.json(trip);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function getTripsHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const trips = await getTripsByUser(req.user.id, req.user.role);

    res.json(trips);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTripHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tripId } = req.params;

    if (!tripId) {
      res.status(400).json({ error: 'Trip ID is required' });
      return;
    }

    const trip = await getTripById(tripId, req.user.id, req.user.role);

    res.json(trip);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}

