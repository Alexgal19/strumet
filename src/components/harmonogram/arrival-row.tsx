'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatYmdPl } from '@/lib/date';

export function ArrivalRow({ p, onUpdate, onRemove, canDelete = true }: { p: any, onUpdate: any, onRemove: any, canDelete?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(p.date);
  const [count, setCount] = useState(p.count);

  const startEditing = () => {
    setDate(p.date);
    setCount(p.count);
    setIsEditing(true);
  };

  // Tryb edycji zamykamy dopiero po udanym zapisie — przy błędzie walidacji dane zostają w polach.
  const handleSave = async () => {
    const ok = await onUpdate(p.id, date, parseInt(count, 10));
    if (ok) setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded">
        <Input type="date" min={format(new Date(), 'yyyy-MM-dd')} className="h-7 text-sm px-2 flex-1" value={date} onChange={e => setDate(e.target.value)} />
        <Input type="number" min="1" max="50" className="h-7 w-16 text-sm px-2" value={count} onChange={e => setCount(e.target.value)} />
        <Button size="icon-sm" variant="ghost" className=" text-emerald-600 shrink-0" onClick={handleSave}><Check className="h-3 w-3" /></Button>
        <Button size="icon-sm" variant="ghost" className=" text-foreground shrink-0" onClick={() => { setDate(p.date); setCount(p.count); setIsEditing(false); }}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-0.5 text-sm">
      <span>📅 {formatYmdPl(p.date) || 'bez daty'} — <strong>{p.count} os.</strong></span>
      <div className="flex items-center gap-0.5">
         <Button type="button" variant="ghost" size="icon-sm" title="Edytuj" aria-label="Edytuj przyjęcie" className=" text-blue-600 hover:text-blue-700" onClick={startEditing}>
           <Pencil className="h-4 w-4" />
         </Button>
         {canDelete && (
           <Button type="button" variant="ghost" size="icon-sm" title="Usuń" aria-label="Usuń przyjęcie" className=" text-destructive" onClick={() => onRemove(p.id)}>
             <Trash2 className="h-4 w-4" />
           </Button>
         )}
      </div>
    </div>
  );
}
