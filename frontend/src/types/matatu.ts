export type UserRole = 'conductor' | 'driver' | 'owner' | 'sacco';

export type FareType = 'normal' | 'rush_hour' | 'off_peak' | 'rain';

export interface Route {
  id: string;
  name: string;
  from: string;
  to: string;
  normalFare: number;
  rushHourFare: number;
  offPeakFare: number;
  rainFare: number;
}

export interface Trip {
  id: string;
  timestamp: Date;
  route: Route;
  fareType: FareType;
  passengerCount: number;
  totalAmount: number;
  conductorId: string;
  driverId: string;
  matatuId: string;
  driverConfirmed: boolean;
  ownerConfirmed: boolean;
  mpesaStatus: 'pending' | 'received' | 'failed';
}

export interface RevenueSplit {
  owner: number;
  driver: number;
  conductor: number;
  sacco: number;
  maintenance: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phoneNumber: string;
}
