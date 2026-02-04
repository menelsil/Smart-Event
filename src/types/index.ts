export type TableType = 'round' | 'square' | 'rectangle' | 'theater' | 'amphitheater';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
}

export interface Seat {
  id: string;
  guestId: string | null;
  position: number;
}

export interface TableRow {
  seatCount: number;
}

export interface Table {
  id: string;
  type: TableType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  seats: Seat[];
  rows?: number;
  seatsPerRow?: number;
  rowConfigs?: TableRow[]; // For amphitheater - different seats per row
  width: number;
  height: number;
}

export interface SeatingLayout {
  tables: Table[];
  guests: Guest[];
  unassignedGuests: string[];
}

export interface DragItem {
  type: 'guest' | 'seat-guest';
  guestId: string;
  sourceTableId?: string;
  sourceSeatId?: string;
}
