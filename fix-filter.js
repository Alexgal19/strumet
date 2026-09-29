const fs = require('fs');

let content = fs.readFileSync('src/app/(app)/harmonogram/page.tsx', 'utf8');

content = content.replace(
  /if \(deptMissing === 0 && jobs\.length === 0\) return null;/,
  `const visibleJobs = jobs.filter(job => getMissing(dept, job.jobTitle) > 0 || getPlannedForJob(dept, job.jobTitle).length > 0);
  if (visibleJobs.length === 0) return null;`
);

content = content.replace(
  /jobs\.length === 0 \? \(/,
  'visibleJobs.length === 0 ? ('
);

content = content.replace(
  /jobs\.map\(\(job, i\) => \{/,
  'visibleJobs.map((job, i) => {'
);

fs.writeFileSync('src/app/(app)/harmonogram/page.tsx', content);
