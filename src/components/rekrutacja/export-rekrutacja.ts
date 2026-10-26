import { format } from 'date-fns';
import { formatDate, parseMaybeDate } from '@/lib/date';
import type { Recruitment } from '@/lib/types';

type ToastFn = (props: {
  variant?: 'default' | 'destructive';
  title?: string;
  description?: string;
}) => void;

export const exportRecruitmentToExcel = async ({
  recruitments,
  sortedRecruitments,
  headcountByDepartment,
  headcountByDeptJob,
  terminationsByDeptJob,
  totalToRecruit,
  totalPlanned,
  toast,
}: {
  recruitments: Recruitment[];
  sortedRecruitments: Recruitment[];
  headcountByDepartment: Map<string, number>;
  headcountByDeptJob: Map<string, number>;
  terminationsByDeptJob: Map<string, number>;
  totalToRecruit: number;
  totalPlanned: number;
  toast: ToastFn;
}) => {
  if (recruitments.length === 0) return;
  try {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');
    const wb = new ExcelJS.Workbook();

    const orderRows = sortedRecruitments.map(r => {
      const planned = r.arrivals.reduce((s, a) => s + (Number(a.count) || 0), 0);
      const doRekrutacji = r.positions.reduce((s, p) => s + (Number(p.toRecruit) || 0), 0);
      const zwalnia = r.positions.reduce(
        (s, p) => s + (terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0),
        0
      );
      const potrzeby = r.positions.reduce((s, p) => {
        const obecnie = headcountByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
        const z = terminationsByDeptJob.get(`${r.department}|${p.jobTitle}`) ?? 0;
        return s + Math.max(0, obecnie + (Number(p.toRecruit) || 0) - z);
      }, 0);
      const pozycje = r.positions.map(p => `${p.jobTitle}: ${p.toRecruit}`).join(', ');
      return [
        r.department,
        pozycje,
        headcountByDepartment.get(r.department) ?? 0,
        zwalnia,
        doRekrutacji,
        potrzeby,
        planned,
        Math.max(0, doRekrutacji - planned),
      ];
    });

    const ws1 = wb.addWorksheet('Podsumowanie');
    ws1.addTable({
      name: 'Podsumowanie',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        'Dział',
        'Stanowiska (ile osób)',
        'Obecnie na dziale',
        'Zwalnia się',
        'Do zrekrutowania',
        'Potrzeby',
        'Zaplanowane przyjęcia',
        'Brakuje',
      ].map(n => ({ name: n, filterButton: true })),
      rows: orderRows,
    });
    ws1.getColumn(1).width = 28;
    ws1.getColumn(2).width = 46;
    [3, 4, 5, 6, 7, 8].forEach(col => (ws1.getColumn(col).width = 20));
    const uniqueDeptHeadcount = new Map<string, number>();
    sortedRecruitments.forEach(r => {
      if (!uniqueDeptHeadcount.has(r.department)) {
        uniqueDeptHeadcount.set(r.department, headcountByDepartment.get(r.department) ?? 0);
      }
    });
    const sumDeptHeadcount = [...uniqueDeptHeadcount.values()].reduce((a, b) => a + b, 0);
    const sumZwalniaAll = orderRows.reduce((s, row) => s + (Number(row[3]) || 0), 0);
    const sumPotrzebyAll = orderRows.reduce((s, row) => s + (Number(row[5]) || 0), 0);
    const totalRow = ws1.addRow([
      'RAZEM',
      '',
      sumDeptHeadcount,
      sumZwalniaAll,
      totalToRecruit,
      sumPotrzebyAll,
      totalPlanned,
      Math.max(0, totalToRecruit - totalPlanned),
    ]);
    totalRow.font = { bold: true };

    const positionRows = sortedRecruitments.flatMap(r =>
      r.positions.map(p => {
        const jobKey = `${r.department}|${p.jobTitle}`;
        const obecnie = headcountByDeptJob.get(jobKey) ?? 0;
        const zwalnia = terminationsByDeptJob.get(jobKey) ?? 0;
        const doRekrutacji = Number(p.toRecruit) || 0;
        return [
          r.department,
          p.jobTitle,
          obecnie,
          zwalnia,
          doRekrutacji,
          Math.max(0, obecnie + doRekrutacji - zwalnia),
        ];
      })
    );

    const ws2 = wb.addWorksheet('Stanowiska');
    ws2.addTable({
      name: 'Stanowiska',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: [
        'Dział',
        'Stanowisko',
        'Obecnie na stanowisku',
        'Zwalnia się',
        'Do zrekrutowania',
        'Potrzeby',
      ].map(n => ({ name: n, filterButton: true })),
      rows: positionRows,
    });
    ws2.getColumn(1).width = 28;
    ws2.getColumn(2).width = 26;
    [3, 4, 5, 6].forEach(col => (ws2.getColumn(col).width = 20));

    const arrivalRows = sortedRecruitments.flatMap(r =>
      r.arrivals.length === 0
        ? [[r.department, '—', 0]]
        : [...r.arrivals]
            .sort((a, b) => {
              const da = parseMaybeDate(a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
              const dbTime = parseMaybeDate(b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
              return da - dbTime;
            })
            .map(a => [r.department, formatDate(a.date) || '—', Number(a.count) || 0])
    );

    const ws3 = wb.addWorksheet('Daty przyjęć');
    ws3.addTable({
      name: 'DatyPrzyjec',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true },
      columns: ['Dział', 'Data przyjęcia', 'Liczba osób'].map(n => ({
        name: n,
        filterButton: true,
      })),
      rows: arrivalRows,
    });
    ws3.getColumn(1).width = 28;
    ws3.getColumn(2).width = 18;
    ws3.getColumn(3).width = 16;


    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `Rekrutacja_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  } catch (error) {
    console.error('Błąd podczas eksportu:', error);
    toast({
      variant: 'destructive',
      title: 'Błąd',
      description: 'Nie udało się wyeksportować danych do pliku Excel.',
    });
  }
};
