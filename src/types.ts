export interface Booking {
  start: number;
  end: number;
  label: string;
}

export interface Room {
  id: string;
  name: string;
  blocked: boolean;
  bookings: Booking[];
}

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };
