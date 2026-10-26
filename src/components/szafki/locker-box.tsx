'use client';

import { cn } from '@/lib/utils';

export function LockerBox({
  id,
  label,
  isEditing,
  isHighlighted,
  isOccupied,
  occupiedBy,
  onChange,
  onClick,
}: {
  id: string;
  label: string;
  isEditing: boolean;
  isHighlighted: boolean;
  isOccupied: boolean;
  occupiedBy?: string;
  onChange: (val: string) => void;
  onClick: () => void;
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        title="Edytuj numer szafki"
        value={label}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onClick()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick();
        }}
        className={cn(
          'w-full h-full min-h-[56px] text-center text-base font-semibold rounded-md border-2 border-primary bg-primary/10 text-primary outline-none px-2'
        )}
      />
    );
  }

  const isLabel = label.includes('OKREME') || label.includes('СТІНА') || label.includes('напрямок');

  return (
    <button
      title={occupiedBy || label}
      onClick={onClick}
      className={cn(
        'w-full min-h-[56px] rounded-md border text-base font-medium transition-all duration-200 flex items-center justify-center px-3 py-2',
        isLabel
          ? 'border-transparent bg-transparent text-muted-foreground cursor-default hover:bg-transparent'
          : isOccupied
            ? 'border-green-500 bg-green-500/20 text-green-700 hover:bg-green-500/30 hover:border-green-600 shadow-[0_0_8px_hsl(var(--green-500)_/_0.2)]'
            : isHighlighted
              ? 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)_/_0.3)] scale-105 z-10'
              : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}
