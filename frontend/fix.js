const fs = require('fs');
const file = 'src/app/(admin)/admin/operation/bus-schedule/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

lines[530] = lines[530].replace('className="flex items-end gap-4"', 'className="flex items-end gap-4 flex-wrap"');

// The new "Trip Selection" content and Footer ends exactly at the `</Dialog>` which is line 1301.
const newRow3Start = 1107;
const newRow3End = 1301;
const extracted = lines.slice(newRow3Start - 1, newRow3End);

// Replace from `Row 3` comment all the way to `</Dialog>`
lines.splice(575 - 1, 780 - 575 + 1, ...extracted);

const shift = extracted.length - (780 - 575 + 1);
const newDuplicateStart = 1095 + shift;
const newDuplicateEnd = 1301 + shift;

lines.splice(newDuplicateStart - 1, newDuplicateEnd - newDuplicateStart + 1);

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed file');
