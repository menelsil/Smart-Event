import type { Table, Guest } from '@/types';
import { Seat } from '../Seat';
import { GripHorizontal, Settings, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useRef } from 'react';
import { useSeatingStore } from '@/hooks/useSeatingStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SquareTableProps {
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

export function SquareTable({ table, guests, isSelected, onSelect, onDelete, onDropOnSeat, draggedGuest, showAllTooltips }: SquareTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { unassignGuestFromSeat, updateTableConfig } = useSeatingStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [seatCount, setSeatCount] = useState(table.seats.length);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const tableSize = table.width;
  const seatSize = 36;
  const seatOffset = 8;
  const containerSize = tableSize + seatSize * 2 + seatOffset * 2;

  // Get seat side (0=top, 1=right, 2=bottom, 3=left) and position
  const getSeatInfo = (index: number, total: number) => {
    const seatsPerSide = Math.ceil(total / 4);
    const side = Math.floor(index / seatsPerSide);
    const sideIndex = index % seatsPerSide;
    const spacing = seatsPerSide > 1 ? tableSize / (seatsPerSide + 1) : tableSize / 2;
    
    const tableLeft = seatSize + seatOffset;
    const tableTop = seatSize + seatOffset;
    const tableRight = tableLeft + tableSize;
    const tableBottom = tableTop + tableSize;
    
    let position;
    switch (side) {
      case 0:
        position = { x: tableLeft + spacing * (sideIndex + 1) - seatSize / 2, y: tableTop - seatSize / 2 - seatOffset / 2 };
        break;
      case 1:
        position = { x: tableRight + seatOffset / 2 - seatSize / 2, y: tableTop + spacing * (sideIndex + 1) - seatSize / 2 };
        break;
      case 2:
        position = { x: tableRight - spacing * (sideIndex + 1) - seatSize / 2, y: tableBottom + seatOffset / 2 - seatSize / 2 };
        break;
      case 3:
        position = { x: tableLeft - seatSize / 2 - seatOffset / 2, y: tableBottom - spacing * (sideIndex + 1) - seatSize / 2 };
        break;
      default:
        position = { x: 0, y: 0 };
    }
    
    return { position, side };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - table.x, y: e.clientY - table.y });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    updateTableConfig(table.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSeatCountChange = (value: number) => {
    setSeatCount(value);
    updateTableConfig(table.id, { seats: value });
  };

  const assignedCount = table.seats.filter((s) => s.guestId).length;

  return (
    <div
      ref={tableRef}
      className={`group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        position: 'absolute',
        left: table.x,
        top: table.y,
        width: containerSize,
        height: containerSize,
        zIndex: isSelected ? 100 : 50,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onSelect}
    >
      <div
        className={`
          absolute rounded-lg bg-card border-2 shadow-lg
          flex items-center justify-center
          transition-all duration-200
          ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
        `}
        style={{ width: tableSize, height: tableSize, left: seatSize + seatOffset, top: seatSize + seatOffset }}
      >
        <div className="text-center pointer-events-none">
          <p className="font-semibold text-sm text-foreground">{table.name}</p>
          <p className="text-xs text-muted-foreground">{assignedCount}/{table.seats.length}</p>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <GripHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {table.seats.map((seat, index) => {
        const { position } = getSeatInfo(index, table.seats.length);
        const guest = seat.guestId ? guests.find((g) => g.id === seat.guestId) || null : null;
        const tableCenter = {
          x: seatSize + seatOffset + tableSize / 2,
          y: seatSize + seatOffset + tableSize / 2,
        };
        return (
          <Seat
            key={seat.id}
            seatId={seat.id}
            tableId={table.id}
            guest={guest}
            position={position}
            size={seatSize}
            index={index}
            onUnassign={unassignGuestFromSeat}
            onDrop={onDropOnSeat}
            isDragOver={!!draggedGuest && !guest}
            forceTooltip={showAllTooltips}
            tableCenter={tableCenter}
          />
        );
      })}

      {isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-card rounded-lg shadow-lg p-1 border z-50">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Настройки стола</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Количество мест: {seatCount}
                  </Label>
                  <Slider value={[seatCount]} onValueChange={([v]) => handleSeatCountChange(v)} min={2} max={24} step={1} />
                </div>
                <Button variant="destructive" className="w-full" onClick={() => { onDelete(); setConfigOpen(false); }}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить стол
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
