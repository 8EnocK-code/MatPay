import { hashTripData } from '../utils/hash';
import { hashRevenueSplit } from '../utils/hash';
import { prisma } from '../prismaClient';

export async function storeTripOnBlockchain(tripId: string): Promise<string> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: true,
    },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  const hash = hashTripData({
    tripId: trip.id,
    routeId: trip.routeId,
    amount: trip.totalAmount,
    passengerCount: trip.passengerCount,
    timestamp: trip.tripDate,
  });

  return hash;
}

export async function storeRevenueSplitOnBlockchain(revenueSplitId: string): Promise<string> {
  const revenueSplit = await prisma.revenueSplit.findUnique({
    where: { id: revenueSplitId },
  });

  if (!revenueSplit) {
    throw new Error('Revenue split not found');
  }

  const hash = hashRevenueSplit({
    tripId: revenueSplit.tripId,
    totalAmount: revenueSplit.totalAmount,
    ownerAmount: revenueSplit.ownerAmount,
    driverAmount: revenueSplit.driverAmount,
    conductorAmount: revenueSplit.conductorAmount,
    saccoAmount: revenueSplit.saccoAmount,
    maintenanceAmount: revenueSplit.maintenanceAmount,
  });

  await prisma.revenueSplit.update({
    where: { id: revenueSplitId },
    data: { blockchainHash: hash },
  });

  return hash;
}

