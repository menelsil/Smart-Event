import { useState, useCallback, useEffect } from 'react';
import { GuestList } from '@/components/GuestList';
import { Canvas } from '@/components/Canvas';
import { TableConfigPanel } from '@/components/TableConfigPanel';
import { useSeatingStore } from '@/hooks/useSeatingStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, LayoutGrid, Settings, Download, Upload, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { Guest } from '@/types';

function App() {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [showAllTooltips, setShowAllTooltips] = useState(false);
  
  const { 
    tables, 
    guests, 
    unassignedGuests, 
    addGuest, 
    removeGuest, 
    importGuests, 
    clearLayout, 
    resetAll,
    assignGuestToSeat,
    moveGuestBetweenSeats,
  } = useSeatingStore();

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;

  // Handle drag start from guest list - only set draggedGuest for drop detection
  const handleGuestDragStart = useCallback((guest: Guest) => {
    setDraggedGuest(guest);
  }, []);

  // Global mouse up handler to ensure drag state is cleared
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggedGuest(null);
    };

    const handleGlobalDragEnd = () => {
      setDraggedGuest(null);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('dragend', handleGlobalDragEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, []);

  // Handle drop on seat
  const handleDropOnSeat = useCallback((guestId: string, tableId: string, seatId: string) => {
    const guest = guests.find(g => g.id === guestId);
    if (!guest) return;
    
    // Check if guest is already assigned to a seat
    const isAssigned = !unassignedGuests.includes(guestId);
    
    if (isAssigned) {
      // Move between seats
      for (const table of tables) {
        for (const seat of table.seats) {
          if (seat.guestId === guestId) {
            moveGuestBetweenSeats(guestId, table.id, seat.id, tableId, seatId);
            toast.success('Гость перемещён');
            setDraggedGuest(null);
            return;
          }
        }
      }
    } else {
      // Assign new guest
      assignGuestToSeat(guestId, tableId, seatId);
      toast.success('Гость назначен на место');
    }
    setDraggedGuest(null);
  }, [assignGuestToSeat, moveGuestBetweenSeats, guests, unassignedGuests, tables]);

  const handleExport = () => {
    const data = {
      tables,
      guests,
      unassignedGuests,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating-plan-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('План рассадки экспортирован');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          JSON.parse(json);
          toast.success('План рассадки импортирован');
        } catch {
          toast.error('Ошибка импорта файла');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-semibold text-lg">Seating Planner</h1>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label htmlFor="import-file">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="w-4 h-4" />
                Импорт
              </span>
            </Button>
          </label>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Экспорт
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Настройки</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Очистить рассадку</p>
                    <p className="text-sm text-muted-foreground">Удалить все столы, сохранить гостей</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      clearLayout();
                      toast.success('Рассадка очищена');
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Сбросить всё</p>
                    <p className="text-sm text-muted-foreground">Удалить все данные</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      resetAll();
                      toast.success('Все данные удалены');
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Guest List */}
        <div className="w-80 flex-shrink-0 border-r hidden lg:block">
          <GuestList
            guests={guests}
            unassignedGuests={unassignedGuests}
            onAddGuest={addGuest}
            onRemoveGuest={removeGuest}
            onImportGuests={importGuests}
            onDragStart={handleGuestDragStart}
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-0">
          <Canvas
            tables={tables}
            guests={guests}
            selectedTableId={selectedTableId}
            onSelectTable={setSelectedTableId}
            onDropOnSeat={handleDropOnSeat}
            draggedGuest={draggedGuest}
            showAllTooltips={showAllTooltips}
          />
        </div>

        {/* Right Sidebar - Table Config */}
        <div className="w-72 flex-shrink-0 border-l hidden xl:block bg-card">
          <TableConfigPanel table={selectedTable} />
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden border-t bg-card">
        <Tabs defaultValue="guests" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="guests" className="gap-2">
              <Users className="w-4 h-4" />
              Гости
            </TabsTrigger>
            <TabsTrigger value="canvas" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Холст
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Настройки
            </TabsTrigger>
          </TabsList>
          <TabsContent value="guests" className="m-0">
            <div className="h-[300px]">
              <GuestList
                guests={guests}
                unassignedGuests={unassignedGuests}
                onAddGuest={addGuest}
                onRemoveGuest={removeGuest}
                onImportGuests={importGuests}
                onDragStart={handleGuestDragStart}
              />
            </div>
          </TabsContent>
          <TabsContent value="canvas" className="m-0">
            <div className="h-[300px]">
              <Canvas
                tables={tables}
                guests={guests}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                onDropOnSeat={handleDropOnSeat}
                draggedGuest={draggedGuest}
                showAllTooltips={showAllTooltips}
              />
            </div>
          </TabsContent>
          <TabsContent value="config" className="m-0">
            <div className="h-[300px]">
              <TableConfigPanel table={selectedTable} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating toggle button for tooltips */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          variant={showAllTooltips ? 'default' : 'secondary'}
          size="sm"
          className="gap-2 shadow-lg"
          onClick={() => setShowAllTooltips(!showAllTooltips)}
        >
          <Eye className="w-4 h-4" />
          {showAllTooltips ? 'Скрыть подсказки' : 'Показать все подсказки'}
        </Button>
      </div>
    </div>
  );
}

export default App;
