const fs = require('fs');
let c = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

c = c.replace('let totalMissing = 0;', 'let totalMissing = 0;\n  let totalTerminations = 0;');
c = c.replace('totalMissing += getMissing(dept, job.jobTitle);', 'totalMissing += getMissing(dept, job.jobTitle);\n      totalTerminations += job.zwalnia;');

const badgeToReplace = `<UserPlus className="h-4 w-4" />
          Łącznie brakuje: {Math.max(0, totalMissing - totalPlanned)}
        </Badge>`;

const newBadge = `<UserPlus className="h-4 w-4" />
          Łącznie brakuje: {Math.max(0, totalMissing - totalPlanned)}
        </Badge>
        {totalTerminations > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 border-red-500/60 px-3 py-1.5 text-sm text-red-700 tabular-nums dark:text-red-400"
          >
            <Users className="h-4 w-4" />
            Planowane zwolnienia: {totalTerminations}
          </Badge>
        )}`;

c = c.replace(badgeToReplace, newBadge);
fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', c);
console.log('Done!');
