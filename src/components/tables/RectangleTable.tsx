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

interface RectangleTableProps {
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

export function RectangleTable({ table, guests, isSelected, onSelect, onDelete, onDropOnSeat, draggedGuest, showAllTooltips }: RectangleTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { unassignGuestFromSeat, updateTableConfig } = useSeatingStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [seatCount, setSeatCount] = useState(table.seats.length);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const tableWidth = table.width;
  const tableHeight = table.height;
  const seatSize = 36;
  const seatOffset = 8;
  const containerWidth = tableWidth + seatSize * 2 + seatOffset * 2;
  const containerHeight = tableHeight + seatSize * 2 + seatOffset * 2;

  // Get seat side (0=top, 1=right, 2=bottom, 3=left) and position
  const getSeatInfo = (index: number, total: number) => {
    const perimeter = 2 * (tableWidth + tableHeight);
    const seatsOnLongSides = Math.round((tableWidth / perimeter) * total * 2);
    const seatsOnShortSides = total - seatsOnLongSides;
    const seatsTopBottom = Math.max(1, Math.floor(seatsOnLongSides / 2));
    const seatsLeftRight = Math.max(1, Math.ceil(seatsOnShortSides / 2));
    
    let side: number, sideIndex: number;
    
    if (index < seatsTopBottom) { side = 0; sideIndex = index; }
    else if (index < seatsTopBottom + seatsLeftRight) { side = 1; sideIndex = index - seatsTopBottom; }
    else if (index < seatsTopBottom * 2 + seatsLeftRight) { side = 2; sideIndex = index - seatsTopBottom - seatsLeftRight; }
    else { side = 3; sideIndex = index - seatsTopBottom * 2 - seatsLeftRight; }

    const tableLeft = seatSize + seatOffset;
    const tableTop = seatSize + seatOffset;
    const tableRight = tableLeft + tableWidth;
    const tableBottom = tableTop + tableHeight;
    const topBottomSpacing = seatsTopBottom > 1 ? tableWidth / seatsTopBottom : tableWidth / 2;
    const leftRightSpacing = seatsLeftRight > 1 ? tableHeight / seatsLeftRight : tableHeight / 2;
    
    let position;
    switch (side) {
      case 0: position = { x: tableLeft + topBottomSpacing * (sideIndex + 0.5) - seatSize / 2, y: tableTop - seatSize / 2 - seatOffset / 2 }; break;
      case 1: position = { x: tableRight + seatOffset / 2 - seatSize / 2, y: tableTop + leftRightSpacing * (sideIndex + 0.5) - seatSize / 2 }; break;
      case 2: position = { x: tableRight - topBottomSpacing * (sideIndex + 0.5) - seatSize / 2, y: tableBottom + seatOffset / 2 - seatSize / 2 }; break;
      case 3: position = { x: tableLeft - seatSize / 2 - seatOffset / 2, y: tableBottom - leftRightSpacing * (sideIndex + 0.5) - seatSize / 2 }; break;
      default: position = { x: 0, y: 0 };
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
    updateTableConfig(table.id, { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
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
      style={{ position: 'absolute', left: table.x, top: table.y, width: containerWidth, height: containerHeight, zIndex: isSelected ? 100 : 50 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onSelect}
    >
      <div
        className={`absolute rounded-lg bg-card border-2 shadow-lg flex items-center justify-center transition-all duration-200 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
        style={{ width: tableWidth, height: tableHeight, left: seatSize + seatOffset, top: seatSize + seatOffset }}
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
          x: seatSize + seatOffset + tableWidth / 2,
          y: seatSize + seatOffset + tableHeight / 2,
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
              <DialogHeader><DialogTitle>Настройки стола</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Количество мест: {seatCount}</Label>
                  <Slider value={[seatCount]} onValueChange={([v]) => handleSeatCountChange(v)} min={2} max={24} step={1} />
                </div>
                <Button variant="destructive" className="w-full" onClick={() => { onDelete(); setConfigOpen(false); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Удалить стол
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
