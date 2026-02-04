import type { Table, Guest, TableRow } from '@/types';
import { Seat } from '../Seat';
import { GripHorizontal, Settings, Trash2, Plus, Minus, Rows } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

interface AmphitheaterTableProps {
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

export function AmphitheaterTable({ table, guests, isSelected, onSelect, onDelete, onDropOnSeat, draggedGuest, showAllTooltips }: AmphitheaterTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const { unassignGuestFromSeat, updateTableConfig } = useSeatingStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const rowConfigs: TableRow[] = table.rowConfigs || Array(table.rows || 5).fill(null).map(() => ({ seatCount: table.seatsPerRow || 8 }));

  const seatSize = 32;
  const rowSpacing = 20;
  const arcRadiusStep = 35;
  const baseRadius = 80;
  const headerHeight = 50;
  const padding = 20;

  const rowData = rowConfigs.map((config, rowIndex) => {
    const radius = baseRadius + rowIndex * arcRadiusStep;
    const seatCount = config.seatCount;
    const arcLength = Math.PI * radius;
    const seatSpacing = arcLength / (seatCount + 1);
    const rowWidth = radius * 2 + seatSize;
    return { radius, seatCount, seatSpacing, rowWidth, rowIndex };
  });

  const maxRowWidth = Math.max(...rowData.map(r => r.rowWidth), 200);
  const containerWidth = maxRowWidth + padding * 2;
  const containerHeight = headerHeight + rowData.length * (seatSize + rowSpacing * 2) + padding * 2 + baseRadius;

  const getSeatPosition = (seatIndex: number) => {
    let cumulativeSeats = 0;
    let rowIndex = 0;
    let seatInRow = seatIndex;
    
    for (let i = 0; i < rowData.length; i++) {
      if (seatIndex < cumulativeSeats + rowData[i].seatCount) {
        rowIndex = i;
        seatInRow = seatIndex - cumulativeSeats;
        break;
      }
      cumulativeSeats += rowData[i].seatCount;
    }

    const row = rowData[rowIndex];
    if (!row) return { x: 0, y: 0 };

    const radius = row.radius;
    const angleStep = Math.PI / (row.seatCount + 1);
    const angle = -Math.PI / 2 + (seatInRow + 1) * angleStep;
    
    const centerX = containerWidth / 2;
    const centerY = headerHeight + padding + baseRadius;
    
    const x = centerX + radius * Math.cos(angle) - seatSize / 2;
    const y = centerY + radius * Math.sin(angle) * 0.4 - seatSize / 2 + rowIndex * (seatSize + rowSpacing * 2);
    
    return { x, y };
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

  const updateRowSeatCount = (rowIndex: number, delta: number) => {
    const newConfigs = [...rowConfigs];
    const currentCount = newConfigs[rowIndex]?.seatCount || 5;
    const newCount = Math.max(2, Math.min(20, currentCount + delta));
    newConfigs[rowIndex] = { seatCount: newCount };
    const totalSeats = newConfigs.reduce((sum, r) => sum + r.seatCount, 0);
    updateTableConfig(table.id, { rowConfigs: newConfigs, seats: totalSeats });
  };

  const addRow = () => {
    const newConfigs = [...rowConfigs, { seatCount: rowConfigs[rowConfigs.length - 1]?.seatCount || 8 }];
    const totalSeats = newConfigs.reduce((sum, r) => sum + r.seatCount, 0);
    updateTableConfig(table.id, { rowConfigs: newConfigs, rows: newConfigs.length, seats: totalSeats });
  };

  const removeRow = () => {
    if (rowConfigs.length <= 1) return;
    const newConfigs = rowConfigs.slice(0, -1);
    const totalSeats = newConfigs.reduce((sum, r) => sum + r.seatCount, 0);
    updateTableConfig(table.id, { rowConfigs: newConfigs, rows: newConfigs.length, seats: totalSeats });
  };

  const assignedCount = table.seats.filter((s) => s.guestId).length;
  const totalSeats = rowConfigs.reduce((sum, r) => sum + r.seatCount, 0);

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
      <div className={`absolute left-0 top-0 rounded-lg bg-card border-2 shadow-lg transition-all duration-200 overflow-visible ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`} style={{ width: containerWidth, height: containerHeight }}>
        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-foreground">{table.name}</p>
            <p className="text-xs text-muted-foreground">{assignedCount}/{totalSeats} мест</p>
          </div>
          <GripHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <svg className="absolute pointer-events-none" style={{ left: 0, top: headerHeight, width: containerWidth, height: containerHeight - headerHeight }}>
          {rowData.map((row, i) => {
            const centerX = containerWidth / 2;
            const centerY = padding + baseRadius;
            const yOffset = i * (seatSize + rowSpacing * 2);
            const startAngle = -Math.PI / 2 - Math.PI / 3;
            const endAngle = -Math.PI / 2 + Math.PI / 3;
            const startX = centerX + row.radius * Math.cos(startAngle);
            const startY = centerY + row.radius * Math.sin(startAngle) * 0.4 + yOffset;
            const endX = centerX + row.radius * Math.cos(endAngle);
            const endY = centerY + row.radius * Math.sin(endAngle) * 0.4 + yOffset;
            const cpX = centerX;
            const cpY = centerY + row.radius * 0.5 + yOffset;
            return (
              <path key={i} d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`} fill="none" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="2" strokeDasharray="4 4" />
            );
          })}
        </svg>

        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: padding }}>
          <div className="bg-primary/10 text-primary text-xs px-6 py-1 rounded-full font-medium whitespace-nowrap">Сцена</div>
        </div>

        {table.seats.slice(0, totalSeats).map((seat, index) => {
          const position = getSeatPosition(index);
          const guest = seat.guestId ? guests.find((g) => g.id === seat.guestId) || null : null;
          return (
            <div key={seat.id} style={{ position: 'absolute', left: position.x, top: position.y, width: seatSize, height: seatSize }}>
              <Seat seatId={seat.id} tableId={table.id} guest={guest} position={{ x: 0, y: 0 }} size={seatSize} index={index} onUnassign={unassignGuestFromSeat} onDrop={onDropOnSeat} isDragOver={!!draggedGuest && !guest} forceTooltip={showAllTooltips} />
            </div>
          );
        })}
      </div>

      {isSelected && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-card rounded-lg shadow-lg p-1 border z-50">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-md max-h-[80vh] overflow-auto">
              <DialogHeader><DialogTitle>Настройки амфитеатра</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2"><Rows className="w-4 h-4" /><span className="font-medium">Количество рядов: {rowConfigs.length}</span></div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={removeRow}><Minus className="w-3 h-3" /></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={addRow}><Plus className="w-3 h-3" /></Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Мест в каждом ряду:</Label>
                  <div className="space-y-2 max-h-[300px] overflow-auto">
                    {rowConfigs.map((row, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">Ряд {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateRowSeatCount(index, -1)}><Minus className="w-3 h-3" /></Button>
                          <span className="text-sm font-medium w-6 text-center">{row.seatCount}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateRowSeatCount(index, 1)}><Plus className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Всего мест: <span className="font-medium text-foreground">{totalSeats}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Форма: дуговые ряды</p>
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
