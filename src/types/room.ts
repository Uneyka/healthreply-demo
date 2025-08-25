export type RoomStatus = 'frei' | 'belegt' | 'reinigung';

export type Room = {
  id: string;           // z.B. "101"
  floor: number;        // Stockwerk
  capacity: number;     // Betten
  status: RoomStatus;   // frei/belegt/reinigung
  notes?: string;       // Notizen (z.B. defektes Fenster)
};
