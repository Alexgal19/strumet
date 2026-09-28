const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

const start = c.indexOf('const handleUpdatePotrzeby =');
const errIdx = c.indexOf('Failed to update potrzeby');
const end = c.indexOf('};', errIdx) + 2;

const newF = `const handleUpdatePotrzeby = async (dept: string, mgr: string, job: string, newAmount: number) => {
    if (!isAdmin) return;
    const key = (dept + '___' + mgr + '___' + job).replace(/[.#$\\[\\]]/g, '_');
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, potrzebyByManager: { ...prev.potrzebyByManager, [key]: newAmount } };
    });
    try {
      const db = getDB();
      if (!db) return;
      const posRef = dbRef(db, 'potrzebyObsady');
      await update(posRef, { [key]: newAmount });
    } catch (err) {
      console.error('Failed to update potrzeby:', err);
    }
  };`;

c = c.substring(0, start) + newF + c.substring(end);
fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', c);
