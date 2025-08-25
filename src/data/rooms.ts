import type { Room } from '@/types/room';

export const rooms: Room[] = [
  { id: '101', floor: 1, capacity: 1, status: 'belegt' },
  { id: '102', floor: 1, capacity: 1, status: 'belegt' },
  { id: '103', floor: 1, capacity: 1, status: 'belegt' },
  { id: '104', floor: 1, capacity: 1, status: 'frei' },
  { id: '201', floor: 2, capacity: 2, status: 'belegt' },
  { id: '202', floor: 2, capacity: 2, status: 'frei' },
  { id: '203', floor: 2, capacity: 1, status: 'reinigung' },
  { id: '204', floor: 2, capacity: 1, status: 'frei' },
];
