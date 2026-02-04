import type { Table } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Move, Users, Rows, Armchair } from 'lucide-react';
import { useSeatingStore } from '@/hooks/useSeatingStore';
import { useState, useEffect } from 'react';

interface TableConfigPanelProps {
  table: Table | null;
}

const tableTypeLabels: Record<string, string> = {
  round: 'Круглый стол',
  square: 'Квадратный стол',
  rectangle: 'Прямоугольный стол',
  theater: 'Кинотеатр',
  amphitheater: 'Амфитеатр',
};

export function TableConfigPanel({ table }: TableConfigPanelProps) {
  const { updateTableConfig, updateTableRotation, updateTablePosition } = useSeatingStore();
  const [localName, setLocalName] = useState('');
  const [localSeats, setLocalSeats] = useState(8);
  const [localRows, setLocalRows] = useState(5);
  const [localSeatsPerRow, setLocalSeatsPerRow] = useState(8);

  useEffect(() => {
    if (table) {
      setLocalName(table.name);
      setLocalSeats(table.seats.length);
      setLocalRows(table.rows || 5);
      setLocalSeatsPerRow(table.seatsPerRow || 8);
    }
  }, [table?.id]);

  if (!table) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
        <div>
          <Move className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Выберите стол для настройки</p>
          <p className="text-xs mt-1">Нажмите на стол на холсте</p>
        </div>
      </div>
    );
  }

  const isTheaterStyle = table.type === 'theater' || table.type === 'amphitheater';

  const handleNameChange = (value: string) => {
    setLocalName(value);
    updateTableConfig(table.id, { name: value });
  };

  const handleSeatsChange = (value: number) => {
    setLocalSeats(value);
    updateTableConfig(table.id, { seats: value });
  };

  const handleRowsChange = (value: number) => {
    setLocalRows(value);
    updateTableConfig(table.id, { rows: value });
  };

  const handleSeatsPerRowChange = (value: number) => {
    setLocalSeatsPerRow(value);
    updateTableConfig(table.id, { seatsPerRow: value });
  };

  const handleRotate = () => {
    const newRotation = (table.rotation + 45) % 360;
    updateTableRotation(table.id, newRotation);
  };

  const assignedCount = table.seats.filter((s) => s.guestId).length;

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-auto">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{tableTypeLabels[table.type]}</p>
        <h3 className="font-semibold">{table.name}</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted rounded-lg p-3 text-center">
          <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-semibold">{assignedCount}/{table.seats.length}</p>
          <p className="text-xs text-muted-foreground">Занято</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <Armchair className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-lg font-semibold">{table.seats.length - assignedCount}</p>
          <p className="text-xs text-muted-foreground">Свободно</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Название</Label>
        <Input
          value={localName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Название стола"
        />
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <Label>Поворот</Label>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRotate} className="gap-2">
            <RotateCw className="w-4 h-4" />
            Повернуть на 45°
          </Button>
          <span className="text-sm text-muted-foreground">{table.rotation}°</span>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Позиция</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">X</span>
            <Input
              type="number"
              value={Math.round(table.x)}
              onChange={(e) => updateTablePosition(table.id, Number(e.target.value), table.y)}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Y</span>
            <Input
              type="number"
              value={Math.round(table.y)}
              onChange={(e) => updateTablePosition(table.id, table.x, Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Seats Configuration */}
      {!isTheaterStyle ? (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Количество мест
          </Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[localSeats]}
              onValueChange={([v]) => handleSeatsChange(v)}
              min={2}
              max={24}
              step={1}
            />
            <span className="text-sm font-medium w-8">{localSeats}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Rows className="w-4 h-4" />
              Количество рядов
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localRows]}
                onValueChange={([v]) => handleRowsChange(v)}
                min={2}
                max={15}
                step={1}
              />
              <span className="text-sm font-medium w-8">{localRows}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Armchair className="w-4 h-4" />
              Мест в ряду
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[localSeatsPerRow]}
                onValueChange={([v]) => handleSeatsPerRowChange(v)}
                min={2}
                max={20}
                step={1}
              />
              <span className="text-sm font-medium w-8">{localSeatsPerRow}</span>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Всего мест: <span className="font-medium text-foreground">{localRows * localSeatsPerRow}</span>
            </p>
          </div>
        </>
      )}

      {/* Size */}
      <div className="space-y-2">
        <Label>Размеры</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-muted-foreground">Ширина</span>
            <Input
              type="number"
              value={Math.round(table.width)}
              onChange={(e) => updateTableConfig(table.id, { width: Number(e.target.value) })}
            />
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Высота</span>
            <Input
              type="number"
              value={Math.round(table.height)}
              onChange={(e) => updateTableConfig(table.id, { height: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
