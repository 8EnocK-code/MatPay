import crypto from 'crypto';

export function hashTripData(tripData: {
  tripId: string;
  routeId: string;
  amount: number;
  passengerCount: number;
  timestamp: Date;
}): string {
  const dataString = JSON.stringify({
    tripId: tripData.tripId,
    routeId: tripData.routeId,
    amount: tripData.amount,
    passengerCount: tripData.passengerCount,
    timestamp: tripData.timestamp.toISOString(),
  });

  return crypto.createHash('sha256').update(dataString).digest('hex');
}

export function hashRevenueSplit(revenueSplit: {
  tripId: string;
  totalAmount: number;
  ownerAmount: number;
  driverAmount: number;
  conductorAmount: number;
  saccoAmount: number;
  maintenanceAmount: number;
}): string {
  const dataString = JSON.stringify(revenueSplit);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

