import { prisma } from '../prismaClient';
import { FareType, TripStatus } from '@prisma/client';
import { hashTripData } from '../utils/hash';
import { hashRevenueSplit } from '../utils/hash';

export interface CreateTripData {
  routeId: string;
  matatuId: string;
  conductorId: string;
  driverId: string;
  fareType: FareType;
  // passengerCount removed - now uses matatu capacity
}

export interface ConfirmTripData {
  tripId: string;
  userId: string;
  role: string;
}

const OWNER_PERCENTAGE = 0.40;
const DRIVER_PERCENTAGE = 0.25;
const CONDUCTOR_PERCENTAGE = 0.15;
const SACCO_PERCENTAGE = 0.15;
const MAINTENANCE_PERCENTAGE = 0.05;

export async function createTrip(data: CreateTripData) {
  const route = await prisma.route.findUnique({
    where: { id: data.routeId },
    include: { fareRules: true },
  });

  if (!route) {
    throw new Error('Route not found');
  }

  const matatu = await prisma.matatu.findUnique({
    where: { id: data.matatuId },
  });

  if (!matatu) {
    throw new Error('Matatu not found');
  }

  const fareRule = route.fareRules.find((rule) => rule.fareType === data.fareType);

  if (!fareRule) {
    throw new Error(`Fare rule not found for fare type: ${data.fareType}`);
  }

  // Use fixed matatu capacity instead of passenger input
  const passengerCount = matatu.capacity;
  const totalAmount = fareRule.amount * passengerCount;

  const trip = await prisma.trip.create({
    data: {
      routeId: data.routeId,
      matatuId: data.matatuId,
      conductorId: data.conductorId,
      driverId: data.driverId,
      fareType: data.fareType,
      passengerCount: passengerCount,
      totalAmount,
      status: TripStatus.pending,
    },
    include: {
      route: true,
      matatu: true,
      conductor: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  return trip;
}

export async function confirmTrip(data: ConfirmTripData) {
  const trip = await prisma.trip.findUnique({
    where: { id: data.tripId },
    include: {
      matatu: true,
      driver: true,
      conductor: true,
    },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  // Only drivers can confirm trips
  if (data.role !== 'driver') {
    throw new Error('Unauthorized: Only drivers can confirm trips');
  }

  if (trip.driverId !== data.userId) {
    throw new Error('Unauthorized: You can only confirm trips assigned to you');
  }

  const updatedTrip = await prisma.trip.update({
    where: { id: data.tripId },
    data: {
      driverConfirmed: true,
      status: TripStatus.confirmed,
    },
    include: {
      route: true,
      matatu: true,
      conductor: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  // Create revenue split immediately when driver confirms
  await createRevenueSplit(updatedTrip.id);

  return updatedTrip;
}

async function createRevenueSplit(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      matatu: true,
      driver: true,
      conductor: true,
    },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  const totalAmount = trip.totalAmount;
  const ownerAmount = totalAmount * OWNER_PERCENTAGE;
  const driverAmount = totalAmount * DRIVER_PERCENTAGE;
  const conductorAmount = totalAmount * CONDUCTOR_PERCENTAGE;
  const saccoAmount = totalAmount * SACCO_PERCENTAGE;
  const maintenanceAmount = totalAmount * MAINTENANCE_PERCENTAGE;

  const revenueSplit = await prisma.revenueSplit.create({
    data: {
      tripId,
      totalAmount,
      ownerAmount,
      driverAmount,
      conductorAmount,
      saccoAmount,
      maintenanceAmount,
      ownerId: trip.matatu.ownerId,
      driverId: trip.driverId,
      conductorId: trip.conductorId,
    },
  });

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
    where: { id: revenueSplit.id },
    data: { blockchainHash: hash },
  });

  await prisma.trip.update({
    where: { id: tripId },
    data: { status: TripStatus.completed },
  });

  await createAlertsForRevenueSplit(revenueSplit);

  return revenueSplit;
}

async function createAlertsForRevenueSplit(revenueSplit: any) {
  const alerts = [
    {
      userId: revenueSplit.ownerId,
      message: `Revenue split completed: KES ${revenueSplit.ownerAmount.toFixed(2)}`,
      type: 'revenue_split',
    },
    {
      userId: revenueSplit.driverId,
      message: `Revenue split completed: KES ${revenueSplit.driverAmount.toFixed(2)}`,
      type: 'revenue_split',
    },
    {
      userId: revenueSplit.conductorId,
      message: `Revenue split completed: KES ${revenueSplit.conductorAmount.toFixed(2)}`,
      type: 'revenue_split',
    },
  ];

  await prisma.alert.createMany({
    data: alerts,
  });
}

export async function getTripsByUser(userId: string, role: string) {
  const where: any = {};

  if (role === 'conductor') {
    where.conductorId = userId;
  } else if (role === 'driver') {
    where.driverId = userId;
  } else if (role === 'owner') {
    where.matatu = {
      ownerId: userId,
    };
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      route: true,
      matatu: true,
      conductor: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      revenueSplit: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return trips;
}

export async function getTripById(tripId: string, userId: string, role: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      route: {
        include: {
          fareRules: true,
        },
      },
      matatu: true,
      conductor: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      revenueSplit: true,
    },
  });

  if (!trip) {
    throw new Error('Trip not found');
  }

  if (role === 'conductor' && trip.conductorId !== userId) {
    throw new Error('Unauthorized');
  }

  if (role === 'driver' && trip.driverId !== userId) {
    throw new Error('Unauthorized');
  }

  if (role === 'owner' && trip.matatu.ownerId !== userId) {
    throw new Error('Unauthorized');
  }

  return trip;
}

