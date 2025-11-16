import { Route, Trip, FareType } from '@/types/matatu';

export const routes: Route[] = [
  {
    id: '1',
    name: 'CBD - Ongata Rongai',
    from: 'CBD',
    to: 'Ongata Rongai',
    normalFare: 100,
    rushHourFare: 120,
    offPeakFare: 80,
    rainFare: 150,
  },
  {
    id: '2',
    name: 'CBD - Ngong',
    from: 'CBD',
    to: 'Ngong',
    normalFare: 120,
    rushHourFare: 150,
    offPeakFare: 100,
    rainFare: 180,
  },
  {
    id: '3',
    name: 'CBD - Kikuyu',
    from: 'CBD',
    to: 'Kikuyu',
    normalFare: 80,
    rushHourFare: 100,
    offPeakFare: 70,
    rainFare: 120,
  },
];

export const mockTrips: Trip[] = [
  {
    id: '1',
    timestamp: new Date('2025-01-14T08:30:00'),
    route: routes[0],
    fareType: 'rush_hour',
    passengerCount: 14,
    totalAmount: 1680,
    conductorId: 'c1',
    driverId: 'd1',
    matatuId: 'm1',
    driverConfirmed: true,
    ownerConfirmed: true,
    mpesaStatus: 'received',
  },
  {
    id: '2',
    timestamp: new Date('2025-01-14T09:15:00'),
    route: routes[0],
    fareType: 'normal',
    passengerCount: 12,
    totalAmount: 1200,
    conductorId: 'c1',
    driverId: 'd1',
    matatuId: 'm1',
    driverConfirmed: true,
    ownerConfirmed: false,
    mpesaStatus: 'received',
  },
  {
    id: '3',
    timestamp: new Date('2025-01-14T10:00:00'),
    route: routes[1],
    fareType: 'normal',
    passengerCount: 10,
    totalAmount: 1200,
    conductorId: 'c1',
    driverId: 'd1',
    matatuId: 'm1',
    driverConfirmed: false,
    ownerConfirmed: false,
    mpesaStatus: 'pending',
  },
];

export const revenueSplitPercentages = {
  owner: 40,
  driver: 25,
  conductor: 20,
  sacco: 10,
  maintenance: 5,
};

export const getFareAmount = (route: Route, fareType: FareType): number => {
  switch (fareType) {
    case 'rush_hour':
      return route.rushHourFare;
    case 'off_peak':
      return route.offPeakFare;
    case 'rain':
      return route.rainFare;
    default:
      return route.normalFare;
  }
};
