'use client';

import { cn } from '@/lib/utils';

export function LockerBox({
  label,
  occupants,
  isEditing,
  isHighlighted,
  isDimmed,
  onChange,
  onClick,
}: {
  label: string;
  occupants: string[];
  isEditing: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onChange: (val: string) => void;
  onClick: () => void;
}) {
  const boxSize = 'w-[76px] h-[60px] shrink-0 rounded-md';

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
        className={cn(boxSize, 'border-2 border-primary bg-primary/10 text-center text-sm font-semibold text-primary outline-none px-1')}
      />
    );
  }

  const isOccupied = occupants.length > 0;
  const isConflict = occupants.length > 1;
  // Pierwszy człon nazwiska wystarczy, żeby rozpoznać właściciela
  const shortName = isConflict ? `${occupants.length} os.` : occupants[0]?.split(' ')[0];

  return (
    <button
      type="button"
      title={isOccupied ? `${label}\n${occupants.join('\n')}` : `${label} — wolna`}
      onClick={onClick}
      className={cn(
        boxSize,
        'flex flex-col items-center justify-center gap-0.5 border px-1 transition-all duration-150',
        isConflict
          ? 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30'
          : isOccupied
            ? 'border-green-500 bg-green-500/20 text-green-800 dark:text-green-300 hover:bg-green-500/30'
            : 'border-border/60 bg-muted/40 text-foreground hover:bg-muted hover:border-primary/40',
        isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isDimmed && 'opacity-30'
      )}
    >
      <span className="text-sm font-semibold leading-none">{label}</span>
      {shortName && <span className="w-full truncate text-center text-[10px] leading-tight opacity-80">{shortName}</span>}
    </button>
  );
}
