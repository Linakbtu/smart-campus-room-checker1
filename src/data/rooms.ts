import type { Room } from '@/types';

export const rooms: Room[] = [
  {
    id: 'A',
    name: 'Room A',
    blocked: false,
    bookings: [
      { start: 600, end: 660, label: 'Calculus 101' },
    ],
  },
  {
    id: 'B',
    name: 'Room B',
    blocked: true,
    bookings: [],
  },
  {
    id: 'C',
    name: 'Room C',
    blocked: false,
    bookings: [],
  },
];
