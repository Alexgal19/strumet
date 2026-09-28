const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

const newFunc = `
  const handleUpdatePotrzeby = async (dept: string, mgr: string, job: string, newAmount: number) => {
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
  };
`;

c = c.replace(/const handleUpdatePotrzeby =[\s\S]*?console\.error\('Failed to update potrzeby:', err\);\n\s*\}\n\s*\};/, newFunc.trim());
fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', c);
