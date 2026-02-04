import type { Table, Guest } from '@/types';
import { Seat } from '../Seat';
import { GripHorizontal, Settings, Trash2, Rows, Armchair } from 'lucide-react';
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

interface TheaterTableProps {
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

export function TheaterTable({ table, guests, isSelected, onSelect, onDelete, onDropOnSeat, draggedGuest, showAllTooltips }: TheaterTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { unassignGuestFromSeat, updateTableConfig } = useSeatingStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [rows, setRows] = useState(table.rows || 5);
  const [seatsPerRow, setSeatsPerRow] = useState(table.seatsPerRow || 8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const seatSize = 36;
  const rowSpacing = 36; // 3x increased for tooltips
  const seatSpacing = 24; // 3x increased for tooltips
  const headerHeight = 70;
  const paddingX = 24;
  const paddingY = 16;

  const contentWidth = seatsPerRow * seatSize + (seatsPerRow - 1) * seatSpacing;
  const contentHeight = rows * seatSize + (rows - 1) * rowSpacing;
  const containerWidth = Math.max(contentWidth + paddingX * 2, 180);
  const containerHeight = headerHeight + contentHeight + paddingY * 2;

  const getSeatPosition = (index: number) => {
    const row = Math.floor(index / seatsPerRow);
    const col = index % seatsPerRow;
    return {
      x: paddingX + col * (seatSize + seatSpacing),
      y: headerHeight + paddingY + row * (seatSize + rowSpacing),
    };
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

  const handleRowsChange = (value: number) => {
    setRows(value);
    updateTableConfig(table.id, { rows: value });
  };

  const handleSeatsPerRowChange = (value: number) => {
    setSeatsPerRow(value);
    updateTableConfig(table.id, { seatsPerRow: value });
  };

  const assignedCount = table.seats.filter((s) => s.guestId).length;

  return (
    <div
      ref={tableRef}
      className={`group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{ position: 'absolute', left: table.x, top: table.y, width: containerWidth, height: containerHeight, zIndex: isDragging ? 1000 : isSelected ? 100 : 50 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onSelect}
    >
      <div className={`absolute left-0 top-0 rounded-lg bg-card border-2 shadow-lg transition-all duration-200 ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`} style={{ width: containerWidth, height: containerHeight }}>
        <div className="bg-muted px-3 py-2 border-b flex items-center justify-between h-[42px]">
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">{table.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">{assignedCount}/{table.seats.length}</p>
          </div>
          <GripHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        <div className="flex justify-center py-1.5 h-[28px]">
          <div className="bg-primary/10 text-primary text-xs px-4 py-0.5 rounded-full font-medium">Сцена</div>
        </div>

        <div className="relative" style={{ marginLeft: paddingX, marginRight: paddingX, marginTop: paddingY, height: contentHeight }}>
          {table.seats.map((seat, index) => {
            const position = getSeatPosition(index);
            const guest = seat.guestId ? guests.find((g) => g.id === seat.guestId) || null : null;
            return (
              <div key={seat.id} style={{ position: 'absolute', left: position.x - paddingX, top: position.y - headerHeight - paddingY, width: seatSize, height: seatSize }}>
                <Seat
                  seatId={seat.id}
                  tableId={table.id}
                  guest={guest}
                  position={{ x: 0, y: 0 }}
                  size={seatSize}
                  index={index}
                  onUnassign={unassignGuestFromSeat}
                  onDrop={onDropOnSeat}
                  isDragOver={!!draggedGuest && !guest}
                  forceTooltip={showAllTooltips}
                  tooltipSide="bottom"
                />
              </div>
            );
          })}
        </div>
      </div>

      {isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-card rounded-lg shadow-lg p-1 border z-50">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-sm">
              <DialogHeader><DialogTitle>Настройки зала</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Rows className="w-4 h-4" /> Количество рядов: {rows}</Label>
                  <Slider value={[rows]} onValueChange={([v]) => handleRowsChange(v)} min={1} max={20} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Armchair className="w-4 h-4" /> Мест в ряду: {seatsPerRow}</Label>
                  <Slider value={[seatsPerRow]} onValueChange={([v]) => handleSeatsPerRowChange(v)} min={2} max={25} step={1} />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Всего мест: <span className="font-medium text-foreground">{rows * seatsPerRow}</span></p>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => { onDelete(); setConfigOpen(false); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Удалить зал
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
