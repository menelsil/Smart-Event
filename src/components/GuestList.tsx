import { useState } from 'react';
import type { Guest } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Search, Upload, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface GuestListProps {
  guests: Guest[];
  unassignedGuests: string[];
  onAddGuest: (firstName: string, lastName: string, middleName?: string) => void;
  onRemoveGuest: (guestId: string) => void;
  onImportGuests: (names: string[]) => void;
  onDragStart: (guest: Guest) => void;
}

// Format: ИФ (First Name initial + Last Name initial)
const getInitialsIF = (guest: Guest): string => {
  const firstInitial = guest.firstName.charAt(0).toUpperCase();
  const lastInitial = guest.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Format: И.О.Фамилия for tooltip
const getFullNameWithInitials = (guest: Guest): string => {
  const firstInitial = guest.firstName.charAt(0).toUpperCase();
  
  if (guest.middleName && guest.middleName.trim()) {
    const middleInitial = guest.middleName.charAt(0).toUpperCase();
    return `${firstInitial}.${middleInitial}.${guest.lastName}`;
  }
  
  if (guest.lastName) {
    return `${firstInitial}.${guest.lastName}`;
  }
  
  return guest.firstName;
};

// Format for display: "Фамилия И." or "Фамилия И.О."
const getDisplayName = (guest: Guest): string => {
  if (!guest.lastName) {
    return guest.firstName;
  }
  
  const firstInitial = guest.firstName.charAt(0).toUpperCase();
  
  if (guest.middleName && guest.middleName.trim()) {
    const middleInitial = guest.middleName.charAt(0).toUpperCase();
    return `${guest.lastName} ${firstInitial}.${middleInitial}.`;
  }
  
  return `${guest.lastName} ${firstInitial}.`;
};

function DraggableGuestItem({ guest, onRemove, onDragStart }: { 
  guest: Guest; 
  onRemove: () => void;
  onDragStart: (guest: Guest) => void;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'guest', 
      guestId: guest.id 
    }));
    onDragStart(guest);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2 p-2 rounded-lg bg-card border hover:border-primary/50 transition-colors group select-none cursor-grab active:cursor-grabbing"
      title={getFullNameWithInitials(guest)}
    >
      <div className="p-1 hover:bg-muted rounded">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 pointer-events-none">
        <span className="text-xs font-medium text-primary">
          {getInitialsIF(guest)}
        </span>
      </div>
      <div className="flex-1 min-w-0 pointer-events-none">
        <p className="text-sm font-medium truncate">{getDisplayName(guest)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </div>
  );
}

export function GuestList({
  guests,
  unassignedGuests,
  onAddGuest,
  onRemoveGuest,
  onImportGuests,
  onDragStart,
}: GuestListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newGuestFirstName, setNewGuestFirstName] = useState('');
  const [newGuestLastName, setNewGuestLastName] = useState('');
  const [newGuestMiddleName, setNewGuestMiddleName] = useState('');
  const [importText, setImportText] = useState('');

  const unassignedGuestList = guests.filter((g) => unassignedGuests.includes(g.id));
  const assignedGuestList = guests.filter((g) => !unassignedGuests.includes(g.id));

  const filteredUnassigned = unassignedGuestList.filter((g) =>
    g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddGuest = () => {
    if (newGuestFirstName.trim() && newGuestLastName.trim()) {
      onAddGuest(
        newGuestFirstName.trim(), 
        newGuestLastName.trim(), 
        newGuestMiddleName.trim() || undefined
      );
      setNewGuestFirstName('');
      setNewGuestLastName('');
      setNewGuestMiddleName('');
      setIsAddDialogOpen(false);
    }
  };

  const handleImport = () => {
    if (importText.trim()) {
      const names = importText.split('\n').filter((n) => n.trim());
      onImportGuests(names);
      setImportText('');
      setIsImportDialogOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            Гости
          </h2>
          <div className="flex gap-1">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить гостя</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Фамилия *</label>
                    <Input
                      value={newGuestLastName}
                      onChange={(e) => setNewGuestLastName(e.target.value)}
                      placeholder="Иванов"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Имя *</label>
                    <Input
                      value={newGuestFirstName}
                      onChange={(e) => setNewGuestFirstName(e.target.value)}
                      placeholder="Иван"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Отчество</label>
                    <Input
                      value={newGuestMiddleName}
                      onChange={(e) => setNewGuestMiddleName(e.target.value)}
                      placeholder="Иванович"
                    />
                  </div>
                  <Button 
                    onClick={handleAddGuest} 
                    className="w-full"
                    disabled={!newGuestFirstName.trim() || !newGuestLastName.trim()}
                  >
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Upload className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Импорт гостей</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Введите имена гостей, каждое с новой строки.<br/>
                    Формат: <strong>Фамилия Имя</strong> или <strong>Фамилия Имя Отчество</strong>
                  </p>
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Иванов Иван&#10;Петров Петр Сергеевич&#10;Сидорова Анна"
                    rows={10}
                  />
                  <Button onClick={handleImport} className="w-full">
                    Импортировать
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по фамилии или имени..."
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Всего: {guests.length}</span>
          <span>Не распределены: {unassignedGuestList.length}</span>
          <span>Рассажены: {assignedGuestList.length}</span>
        </div>
      </div>

      {/* Guest Lists */}
      <ScrollArea className="flex-1 h-full overflow-hidden">
        <div className="p-4 space-y-4 min-h-0">
          {/* Unassigned Guests */}
          {filteredUnassigned.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Не распределены ({filteredUnassigned.length})
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Перетащите гостя на свободное место
              </p>
              <div className="space-y-1">
                {filteredUnassigned.map((guest) => (
                  <DraggableGuestItem
                    key={guest.id}
                    guest={guest}
                    onRemove={() => onRemoveGuest(guest.id)}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assigned Guests */}
          {assignedGuestList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Рассажены ({assignedGuestList.length})
              </h3>
              <div className="space-y-1">
                {assignedGuestList.map((guest) => (
                  <DraggableGuestItem
                    key={guest.id}
                    guest={guest}
                    onRemove={() => onRemoveGuest(guest.id)}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          )}

          {guests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Нет гостей</p>
              <p className="text-xs mt-1">Добавьте гостей вручную или импортируйте список</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
