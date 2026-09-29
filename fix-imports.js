const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');
c = c.replace(/import \{ ref as dbRef, update \} from 'firebase\/database';/, "import { ref as dbRef, update, push, set, remove } from 'firebase/database';");
c = c.replace(/CalendarPlus \} from 'lucide-react';/, "CalendarPlus, Trash2 } from 'lucide-react';");
fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', c);
