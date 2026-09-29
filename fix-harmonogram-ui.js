const fs = require('fs');
let content = fs.readFileSync('src/components/harmonogram-view.tsx', 'utf8');

const cardTitle = content.indexOf('Harmonogram obsady - {result.monthLabel}');
const cardTitleEnd = content.indexOf('</CardTitle>', cardTitle);

if (cardTitle !== -1 && cardTitleEnd !== -1) {
    const badgeUI = `
          <div className="flex-1 px-4 hidden sm:flex items-center">
            {totals.currentMonthArrivals && totals.currentMonthArrivals.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 border-blue-500/30 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                    <CalendarPlus className="h-4 w-4" />
                    Zaplanowane przyjęcia: {totals.currentMonthArrivals.reduce((sum, a) => sum + a.count, 0)} os.
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="border-b bg-muted/50 px-4 py-2.5">
                    <h4 className="font-medium flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4" /> Oczekiwani w tym miesiącu</h4>
                  </div>
                  <div className="p-2 max-h-[300px] overflow-auto">
                    {totals.currentMonthArrivals.map(arr => (
                      <div key={arr.id} className="flex flex-col gap-0.5 rounded-md p-2 hover:bg-muted/50 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-emerald-600">{format(new Date(arr.date), 'dd.MM')}</span>
                          <span className="font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs">{arr.count} os.</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{arr.jobTitle} <span className="opacity-50">({arr.department})</span></span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
    `;
    content = content.substring(0, cardTitleEnd + 12) + badgeUI + content.substring(cardTitleEnd + 12);
    fs.writeFileSync('src/components/harmonogram-view.tsx', content);
    console.log('Fixed UI in harmonogram-view.tsx');
} else {
    console.log('Not found');
}
