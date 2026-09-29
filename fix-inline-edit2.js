const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

if (!code.includes('Pencil')) {
  code = code.replace(/Trash2 \} from 'lucide-react';/, "Trash2, Pencil, Check, X } from 'lucide-react';");
}

const handleRemoveFn = `  const handleRemoveArrival = async (id: string) => {`;
const handleUpdateFn = `  const handleUpdateArrival = async (id: string, newDate: string, newCount: number) => {
    const db = getDB();
    if (!db) return;
    try {
      await update(dbRef(db, \`planowanePrzyjecia/\${id}\`), { date: newDate, count: newCount });
      setData(prev => {
        if (!prev) return prev;
        const current = { ...(prev.planowanePrzyjecia || {}) };
        if (current[id]) {
          current[id] = { ...current[id], date: newDate, count: newCount };
        }
        return { ...prev, planowanePrzyjecia: current };
      });
    } catch (err) {
      console.error('Failed to update arrival:', err);
    }
  };

  const handleRemoveArrival = async (id: string) => {`;

code = code.replace(handleRemoveFn, handleUpdateFn);

const arrivalComponent = `function ArrivalRow({ p, onUpdate, onRemove }: { p: any, onUpdate: any, onRemove: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(p.date);
  const [count, setCount] = useState(p.count);

  const handleSave = () => {
    onUpdate(p.id, date, parseInt(count, 10));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 bg-muted/30 p-1 rounded">
        <Input type="date" className="h-7 text-xs px-2 flex-1" value={date} onChange={e => setDate(e.target.value)} />
        <Input type="number" className="h-7 w-16 text-xs px-2" value={count} onChange={e => setCount(e.target.value)} />
        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 shrink-0" onClick={handleSave}><Check className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => { setDate(p.date); setCount(p.count); setIsEditing(false); }}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-xs group">
      <span>📅 {format(new Date(p.date), 'dd.MM.yyyy')} — <strong>{p.count} os.</strong></span>
      <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
         <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-blue-600 hover:text-blue-700" onClick={() => setIsEditing(true)}>
           <Pencil className="h-3 w-3" />
         </Button>
         <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => onRemove(p.id)}>
           <Trash2 className="h-3 w-3" />
         </Button>
      </div>
    </div>
  );
}
`;

if (!code.includes('function ArrivalRow')) {
  code = code + '\n' + arrivalComponent;
}

const oldMap = `{jobPlanned.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-xs">
                                          <span>📅 {format(new Date(p.date), 'dd.MM.yyyy')} — <strong>{p.count} os.</strong></span>
                                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleRemoveArrival(p.id)}>
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}`;

const newMap = `{jobPlanned.map(p => (
                                        <ArrivalRow key={p.id} p={p} onUpdate={handleUpdateArrival} onRemove={handleRemoveArrival} />
                                      ))}`;

code = code.replace(oldMap, newMap);

fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', code);
console.log('Done modifying page.tsx correctly');
