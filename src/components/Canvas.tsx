import { useState, useRef } from 'react';
import type { Table, Guest } from '@/types';
import { TableRenderer } from './TableRenderer';
import { useSeatingStore } from '@/hooks/useSeatingStore';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Grid3X3, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CanvasProps {
  tables: Table[];
  guests: Guest[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string | null) => void;
  onDropOnSeat: (guestId: string, tableId: string, seatId: string) => void;
  draggedGuest: Guest | null;
  showAllTooltips?: boolean;
}

const tableTypeLabels: Record<string, string> = {
  round: 'Круглый стол',
  square: 'Квадратный стол',
  rectangle: 'Прямоугольный стол',
  theater: 'Кинотеатр',
  amphitheater: 'Амфитеатр',
};

export function Canvas({ 
  tables, 
  guests, 
  selectedTableId, 
  onSelectTable,
  onDropOnSeat,
  draggedGuest,
  showAllTooltips = false
}: CanvasProps) {
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [newTableType, setNewTableType] = useState<string>('round');
  const [newTableName, setNewTableName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  const { addTable, removeTable, updateTablePosition } = useSeatingStore();

  const handleAddTable = () => {
    if (newTableName.trim()) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const centerX = canvasRect ? (canvasRect.width / 2 - 100) / scale : 100;
      const centerY = canvasRect ? (canvasRect.height / 2 - 50) / scale : 100;
      
      addTable(newTableType as any, newTableName.trim(), centerX, centerY);
      setNewTableName('');
      setIsAddTableOpen(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectTable(null);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s * 1.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s / 1.2, 0.3));
  const resetZoom = () => setScale(1);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Добавить стол
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить стол</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Тип стола</Label>
                  <Select value={newTableType} onValueChange={setNewTableType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Круглый стол</SelectItem>
                      <SelectItem value="square">Квадратный стол</SelectItem>
                      <SelectItem value="rectangle">Прямоугольный стол</SelectItem>
                      <SelectItem value="theater">Кинотеатр</SelectItem>
                      <SelectItem value="amphitheater">Амфитеатр</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder={`${tableTypeLabels[newTableType]} 1`}
                  />
                </div>
                <Button onClick={handleAddTable} className="w-full">
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {selectedTableId && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => {
                removeTable(selectedTableId);
                onSelectTable(null);
              }}
            >
              <Trash2 className="w-4 h-4" />
              Удалить
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={showGrid ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden bg-muted/30 relative">
        <div
          ref={canvasRef}
          className="w-full h-full relative overflow-auto"
          onClick={handleCanvasClick}
        >
          <div
            className="absolute min-w-[2000px] min-h-[1500px] origin-top-left transition-transform"
            style={{
              transform: `scale(${scale})`,
              background: showGrid
                ? `
                  linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                `
                : undefined,
              backgroundSize: showGrid ? '20px 20px' : undefined,
            }}
          >
            {tables.map((table) => (
              <TableRenderer
                key={table.id}
                table={table}
                guests={guests}
                isSelected={selectedTableId === table.id}
                onSelect={() => onSelectTable(table.id)}
                onDelete={() => {
                  removeTable(table.id);
                  onSelectTable(null);
                }}
                scale={scale}
                onUpdatePosition={(x, y) => updateTablePosition(table.id, x, y)}
                onDropOnSeat={onDropOnSeat}
                draggedGuest={draggedGuest}
                showAllTooltips={showAllTooltips}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
