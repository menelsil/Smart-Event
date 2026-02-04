import { useState, forwardRef } from 'react';
import type { Guest } from '@/types';
import { User, X } from 'lucide-react';

interface SeatProps {
  seatId: string;
  tableId: string;
  guest: Guest | null;
  position: { x: number; y: number };
  size?: number;
  index?: number;
  onUnassign?: (tableId: string, seatId: string) => void;
  onDrop?: (guestId: string, tableId: string, seatId: string) => void;
  isDragOver?: boolean;
  forceTooltip?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  tableCenter?: { x: number; y: number };
}

// Format: ИФ (First Name initial + Last Name initial)
const getInitialsIF = (guest: Guest): string => {
  const firstInitial = guest.firstName.charAt(0).toUpperCase();
  const lastInitial = guest.lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
};

// Format: И.О.Фамилия (First.Mid.Last)
const getTooltipName = (guest: Guest): string => {
  const firstInitial = guest.firstName.charAt(0).toUpperCase();
  const lastName = guest.lastName;
  
  if (guest.middleName && guest.middleName.trim()) {
    const middleInitial = guest.middleName.charAt(0).toUpperCase();
    return `${firstInitial}.${middleInitial}.${lastName}`;
  }
  
  return `${firstInitial}.${lastName}`;
};

export const Seat = forwardRef<HTMLDivElement, SeatProps>(
  ({ seatId, tableId, guest, position, size = 40, index, onUnassign, onDrop, isDragOver, forceTooltip = false, tooltipSide = 'top', tableCenter }, forwardedRef) => {
    const [isHovered, setIsHovered] = useState(false);

    // Calculate tooltip side - OPPOSITE from table center
    const getTooltipSideFromCenter = (): 'top' | 'bottom' | 'left' | 'right' => {
      if (!tableCenter) return tooltipSide;
      
      const seatCenterX = position.x + size / 2;
      const seatCenterY = position.y + size / 2;
      const dx = seatCenterX - tableCenter.x;
      const dy = seatCenterY - tableCenter.y;
      
      // Tooltip should appear on the side AWAY from the center (opposite direction)
      if (Math.abs(dx) > Math.abs(dy)) {
        // Seat is more horizontally offset from center
        return dx > 0 ? 'right' : 'left'; // If seat is right of center, tooltip on right (away from center)
      } else {
        // Seat is more vertically offset from center
        return dy > 0 ? 'bottom' : 'top'; // If seat is below center, tooltip on bottom (away from center)
      }
    };

    const finalTooltipSide = tableCenter ? getTooltipSideFromCenter() : tooltipSide;

    const handleDragOver = (e: React.DragEvent) => {
      if (!guest) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (guest) return;
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === 'guest' && onDrop) {
          onDrop(data.guestId, tableId, seatId);
        }
      } catch {
        // Ignore invalid drop data
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (guest && onUnassign) {
        onUnassign(tableId, seatId);
      }
    };

    const style = {
      position: 'absolute' as const,
      left: position.x,
      top: position.y,
      width: size,
      height: size,
    };

    // Empty seat
    if (!guest) {
      return (
        <div
          ref={forwardedRef}
          style={style}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            rounded-full flex items-center justify-center text-xs font-medium
            transition-all duration-200 select-none
            bg-muted border-2 border-dashed border-muted-foreground/30 
            cursor-pointer hover:border-primary/50 hover:bg-muted/80
            ${isDragOver ? 'ring-2 ring-primary ring-offset-2 scale-110 bg-primary/10' : ''}
          `}
          title={`Место ${index !== undefined ? index + 1 : ''} (перетащите гостя сюда)`}
        >
          <User className="w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        </div>
      );
    }

    // Occupied seat with custom tooltip
    const getTooltipStyle = () => {
      const tooltipOffset = 32;
      switch (finalTooltipSide) {
        case 'top':
          return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${tooltipOffset}px` };
        case 'bottom':
          return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: `${tooltipOffset}px` };
        case 'left':
          return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: `${tooltipOffset}px` };
        case 'right':
          return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: `${tooltipOffset}px` };
      }
    };

    return (
      <div
        ref={forwardedRef}
        style={style}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({ 
            type: 'seat-guest', 
            guestId: guest.id,
            sourceTableId: tableId,
            sourceSeatId: seatId
          }));
        }}
        className="rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 select-none bg-primary text-primary-foreground shadow-md cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="truncate px-1 text-center max-w-full pointer-events-none text-sm font-semibold">
            {getInitialsIF(guest)}
          </span>
          {(isHovered || forceTooltip) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center pointer-events-none">
              <X className="w-2.5 h-2.5 text-destructive-foreground" />
            </div>
          )}
        </div>
        {/* Custom tooltip positioned relative to seat */}
        {(isHovered || forceTooltip) && (
          <div 
            className="absolute bg-popover text-popover-foreground border shadow-lg px-3 py-1.5 rounded-md whitespace-nowrap z-[1000] pointer-events-none text-sm"
            style={getTooltipStyle()}
          >
            <p className="font-medium">{getTooltipName(guest)}</p>
          </div>
        )}
      </div>
    );
  }
);

Seat.displayName = 'Seat';
