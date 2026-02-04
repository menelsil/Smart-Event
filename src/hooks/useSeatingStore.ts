import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Table, Guest, SeatingLayout, TableType, Seat, TableRow } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface TableConfigUpdate {
  name?: string;
  x?: number;
  y?: number;
  rotation?: number;
  width?: number;
  height?: number;
  rows?: number;
  seatsPerRow?: number;
  seats?: number; // Number of seats (will trigger recreation)
  rowConfigs?: TableRow[]; // For amphitheater
}

interface SeatingStore extends SeatingLayout {
  // Guest management
  addGuest: (firstName: string, lastName: string, middleName?: string) => void;
  removeGuest: (guestId: string) => void;
  importGuests: (names: string[]) => void;
  
  // Table management
  addTable: (type: TableType, name: string, x: number, y: number) => void;
  removeTable: (tableId: string) => void;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  updateTableRotation: (tableId: string, rotation: number) => void;
  updateTableConfig: (tableId: string, config: TableConfigUpdate) => void;
  
  // Seating assignment
  assignGuestToSeat: (guestId: string, tableId: string, seatId: string) => void;
  unassignGuestFromSeat: (tableId: string, seatId: string) => void;
  moveGuestBetweenSeats: (guestId: string, fromTableId: string, fromSeatId: string, toTableId: string, toSeatId: string) => void;
  
  // Layout
  clearLayout: () => void;
  resetAll: () => void;
}

const createSeats = (type: TableType, seatsCount: number, rows?: number, seatsPerRow?: number): Seat[] => {
  const seats: Seat[] = [];
  
  if (type === 'theater' || type === 'amphitheater') {
    const actualRows = rows || 5;
    const actualSeatsPerRow = seatsPerRow || 8;
    const totalSeats = actualRows * actualSeatsPerRow;
    
    for (let i = 0; i < totalSeats; i++) {
      seats.push({
        id: uuidv4(),
        guestId: null,
        position: i,
      });
    }
  } else {
    for (let i = 0; i < seatsCount; i++) {
      seats.push({
        id: uuidv4(),
        guestId: null,
        position: i,
      });
    }
  }
  
  return seats;
};

const getDefaultTableSize = (type: TableType): { width: number; height: number; seats: number } => {
  switch (type) {
    case 'round':
      return { width: 160, height: 160, seats: 8 };
    case 'square':
      return { width: 140, height: 140, seats: 8 };
    case 'rectangle':
      return { width: 200, height: 120, seats: 10 };
    case 'theater':
      return { width: 400, height: 300, seats: 40 };
    case 'amphitheater':
      return { width: 400, height: 300, seats: 40 };
    default:
      return { width: 160, height: 160, seats: 8 };
  }
};

const parseGuestName = (fullName: string): { firstName: string; lastName: string; middleName?: string } => {
  const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  
  if (parts.length === 1) {
    // Only one name provided - treat as first name
    return { firstName: parts[0], lastName: '' };
  } else if (parts.length === 2) {
    // Two parts: "Фамилия Имя" (Russian standard format)
    return { lastName: parts[0], firstName: parts[1] };
  } else {
    // 3+ parts: "Фамилия Имя Отчество" (Russian standard format with patronymic)
    // Or "LastName FirstName MiddleName" for English format
    return { 
      lastName: parts[0],
      firstName: parts[1],
      middleName: parts.slice(2).join(' ')
    };
  }
};

export const useSeatingStore = create<SeatingStore>()(
  persist(
    (set) => ({
      tables: [],
      guests: [],
      unassignedGuests: [],

      addGuest: (firstName: string, lastName: string, middleName?: string) => {
        // Format: "Фамилия Имя" or "Фамилия Имя Отчество"
        const formattedFullName = middleName?.trim() 
          ? `${lastName.trim()} ${firstName.trim()} ${middleName.trim()}`
          : `${lastName.trim()} ${firstName.trim()}`.trim();
        
        const guest: Guest = {
          id: uuidv4(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          middleName: middleName?.trim() || undefined,
          fullName: formattedFullName,
        };
        set((state) => ({
          guests: [...state.guests, guest],
          unassignedGuests: [...state.unassignedGuests, guest.id],
        }));
      },

      removeGuest: (guestId: string) => {
        set((state) => {
          // Remove guest from any seat they're assigned to
          const updatedTables = state.tables.map((table) => ({
            ...table,
            seats: table.seats.map((seat) =>
              seat.guestId === guestId ? { ...seat, guestId: null } : seat
            ),
          }));

          return {
            tables: updatedTables,
            guests: state.guests.filter((g) => g.id !== guestId),
            unassignedGuests: state.unassignedGuests.filter((id) => id !== guestId),
          };
        });
      },

      importGuests: (names: string[]) => {
        const newGuests: Guest[] = [];
        const newIds: string[] = [];

        names.forEach((name) => {
          if (name.trim()) {
            const parsed = parseGuestName(name.trim());
            // Format fullName consistently: "Фамилия Имя" or "Фамилия Имя Отчество"
            const formattedFullName = parsed.middleName 
              ? `${parsed.lastName} ${parsed.firstName} ${parsed.middleName}`
              : `${parsed.lastName} ${parsed.firstName}`.trim();
            
            const guest: Guest = {
              id: uuidv4(),
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              middleName: parsed.middleName,
              fullName: formattedFullName,
            };
            newGuests.push(guest);
            newIds.push(guest.id);
          }
        });

        set((state) => ({
          guests: [...state.guests, ...newGuests],
          unassignedGuests: [...state.unassignedGuests, ...newIds],
        }));
      },

      addTable: (type: TableType, name: string, x: number, y: number) => {
        const { width, height, seats } = getDefaultTableSize(type);
        const isTheaterStyle = type === 'theater' || type === 'amphitheater';
        const isAmphitheater = type === 'amphitheater';
        
        const newTable: Table = {
          id: uuidv4(),
          type,
          name,
          x,
          y,
          rotation: 0,
          width,
          height,
          rows: isTheaterStyle ? 5 : undefined,
          seatsPerRow: isTheaterStyle ? 8 : undefined,
          rowConfigs: isAmphitheater ? Array(5).fill(null).map(() => ({ seatCount: 8 })) : undefined,
          seats: createSeats(type, seats, 5, 8),
        };

        set((state) => ({
          tables: [...state.tables, newTable],
        }));
      },

      removeTable: (tableId: string) => {
        set((state) => {
          const table = state.tables.find((t) => t.id === tableId);
          const assignedGuestIds = table?.seats
            .filter((s) => s.guestId)
            .map((s) => s.guestId!) || [];

          return {
            tables: state.tables.filter((t) => t.id !== tableId),
            unassignedGuests: [...state.unassignedGuests, ...assignedGuestIds],
          };
        });
      },

      updateTablePosition: (tableId: string, x: number, y: number) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, x, y } : t
          ),
        }));
      },

      updateTableRotation: (tableId: string, rotation: number) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, rotation } : t
          ),
        }));
      },

      updateTableConfig: (tableId: string, config: TableConfigUpdate) => {
        set((state) => {
          const table = state.tables.find((t) => t.id === tableId);
          if (!table) return state;

          const updatedTable: Table = { ...table };
          
          // Apply simple updates
          if (config.name !== undefined) updatedTable.name = config.name;
          if (config.x !== undefined) updatedTable.x = config.x;
          if (config.y !== undefined) updatedTable.y = config.y;
          if (config.rotation !== undefined) updatedTable.rotation = config.rotation;
          if (config.width !== undefined) updatedTable.width = config.width;
          if (config.height !== undefined) updatedTable.height = config.height;
          if (config.rows !== undefined) updatedTable.rows = config.rows;
          if (config.seatsPerRow !== undefined) updatedTable.seatsPerRow = config.seatsPerRow;
          if (config.rowConfigs !== undefined) updatedTable.rowConfigs = config.rowConfigs;
          
          // Recreate seats if seating configuration changed
          if (config.seats !== undefined || config.rows !== undefined || config.seatsPerRow !== undefined || config.rowConfigs !== undefined) {
            // For amphitheater with rowConfigs
            if (config.rowConfigs) {
              const seatsCount = config.seats ?? config.rowConfigs.reduce((sum, r) => sum + r.seatCount, 0);
              const existingSeats = table.seats;
              const newSeats: Seat[] = [];
              
              for (let i = 0; i < seatsCount; i++) {
                newSeats.push({
                  id: i < existingSeats.length ? existingSeats[i].id : uuidv4(),
                  guestId: i < existingSeats.length ? existingSeats[i].guestId : null,
                  position: i,
                });
              }
              
              updatedTable.seats = newSeats;
            } else {
              const seatsCount = config.seats ?? table.seats.length;
              const rows = config.rows ?? table.rows;
              const seatsPerRow = config.seatsPerRow ?? table.seatsPerRow;
              
              // Preserve existing guest assignments where possible
              const existingSeats = table.seats;
              const newSeats = createSeats(table.type, seatsCount, rows, seatsPerRow);
              
              for (let i = 0; i < Math.min(existingSeats.length, newSeats.length); i++) {
                newSeats[i].guestId = existingSeats[i].guestId;
              }
              
              updatedTable.seats = newSeats;
            }
          }

          return {
            tables: state.tables.map((t) =>
              t.id === tableId ? updatedTable : t
            ),
          };
        });
      },

      assignGuestToSeat: (guestId: string, tableId: string, seatId: string) => {
        set((state) => {
          // Remove guest from any previous seat
          const tablesWithGuestRemoved = state.tables.map((t) => ({
            ...t,
            seats: t.seats.map((s) =>
              s.guestId === guestId ? { ...s, guestId: null } : s
            ),
          }));

          // Assign to new seat
          const updatedTables = tablesWithGuestRemoved.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  seats: t.seats.map((s) =>
                    s.id === seatId ? { ...s, guestId } : s
                  ),
                }
              : t
          );

          return {
            tables: updatedTables,
            unassignedGuests: state.unassignedGuests.filter((id) => id !== guestId),
          };
        });
      },

      unassignGuestFromSeat: (tableId: string, seatId: string) => {
        set((state) => {
          const table = state.tables.find((t) => t.id === tableId);
          const seat = table?.seats.find((s) => s.id === seatId);
          const guestId = seat?.guestId;

          if (!guestId) return state;

          return {
            tables: state.tables.map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    seats: t.seats.map((s) =>
                      s.id === seatId ? { ...s, guestId: null } : s
                    ),
                  }
                : t
            ),
            unassignedGuests: [...state.unassignedGuests, guestId],
          };
        });
      },

      moveGuestBetweenSeats: (guestId: string, fromTableId: string, fromSeatId: string, toTableId: string, toSeatId: string) => {
        set((state) => {
          let displacedGuestId: string | null = null;
          
          const updatedTables = state.tables.map((t) => {
            if (t.id === fromTableId) {
              return {
                ...t,
                seats: t.seats.map((s) =>
                  s.id === fromSeatId ? { ...s, guestId: null } : s
                ),
              };
            }
            if (t.id === toTableId) {
              // If target seat has a guest, they become unassigned
              const targetSeat = t.seats.find((s) => s.id === toSeatId);
              displacedGuestId = targetSeat?.guestId || null;

              return {
                ...t,
                seats: t.seats.map((s) =>
                  s.id === toSeatId ? { ...s, guestId } : s
                ),
              };
            }
            return t;
          });

          const newUnassigned = [...state.unassignedGuests];
          if (displacedGuestId && displacedGuestId !== guestId) {
            newUnassigned.push(displacedGuestId);
          }

          return { 
            tables: updatedTables,
            unassignedGuests: newUnassigned
          };
        });
      },

      clearLayout: () => {
        set((state) => {
          const allAssignedGuestIds = state.tables
            .flatMap((t) => t.seats)
            .filter((s) => s.guestId)
            .map((s) => s.guestId!);

          return {
            tables: [],
            unassignedGuests: [...state.unassignedGuests, ...allAssignedGuestIds],
          };
        });
      },

      resetAll: () => {
        set({
          tables: [],
          guests: [],
          unassignedGuests: [],
        });
      },
    }),
    {
      name: 'seating-planner-storage',
    }
  )
);
