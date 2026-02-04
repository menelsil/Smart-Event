import type { Table, Guest } from '@/types';
import { RoundTable, SquareTable, RectangleTable, TheaterTable, AmphitheaterTable } from './tables';

interface TableRendererProps {
  table: Table;
  guests: Guest[];
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  scale?: number;
  onUpdatePosition?: (x: number, y: number) => void;
  onDropOnSeat?: (guestId: string, tableId: string, seatId: string) => void;
  draggedGuest?: Guest | null;
  showAllTooltips?: boolean;
}

export function TableRenderer({ table, guests, isSelected, onSelect, onDelete, scale = 1, onUpdatePosition, onDropOnSeat, draggedGuest, showAllTooltips }: TableRendererProps) {
  switch (table.type) {
    case 'round':
      return (
        <RoundTable
          table={table}
          guests={guests}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          scale={scale}
          onUpdatePosition={onUpdatePosition}
          onDropOnSeat={onDropOnSeat}
          draggedGuest={draggedGuest}
          showAllTooltips={showAllTooltips}
        />
      );
    case 'square':
      return (
        <SquareTable
          table={table}
          guests={guests}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          scale={scale}
          onUpdatePosition={onUpdatePosition}
          onDropOnSeat={onDropOnSeat}
          draggedGuest={draggedGuest}
          showAllTooltips={showAllTooltips}
        />
      );
    case 'rectangle':
      return (
        <RectangleTable
          table={table}
          guests={guests}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          scale={scale}
          onUpdatePosition={onUpdatePosition}
          onDropOnSeat={onDropOnSeat}
          draggedGuest={draggedGuest}
          showAllTooltips={showAllTooltips}
        />
      );
    case 'theater':
      return (
        <TheaterTable
          table={table}
          guests={guests}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          scale={scale}
          onUpdatePosition={onUpdatePosition}
          onDropOnSeat={onDropOnSeat}
          draggedGuest={draggedGuest}
          showAllTooltips={showAllTooltips}
        />
      );
    case 'amphitheater':
      return (
        <AmphitheaterTable
          table={table}
          guests={guests}
          isSelected={isSelected}
          onSelect={onSelect}
          onDelete={onDelete}
          scale={scale}
          onUpdatePosition={onUpdatePosition}
          onDropOnSeat={onDropOnSeat}
          draggedGuest={draggedGuest}
          showAllTooltips={showAllTooltips}
        />
      );
    default:
      return null;
  }
}
