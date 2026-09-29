const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');
c = c.replace("import type { HarmonogramData } from '@/lib/harmonogram';", "import { type HarmonogramData, buildHarmonogram } from '@/lib/harmonogram';");
fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', c);
