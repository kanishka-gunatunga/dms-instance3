const fs = require('fs');
const files = [
  "src/app/all-documents/page.tsx",
  "src/app/advanced-search/page.tsx",
  "src/app/assigned-documents/page.tsx",
  "src/app/archived-documents/page.tsx",
  "src/app/deleted-documents/page.tsx",
  "src/app/deep-search/page.tsx"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('</tbody>')) {
     const parts = content.split('</tbody>');
     // parts[1] contains all content after the list
     if (parts[1]) {
       parts[1] = parts[1].replace(/,\s*item\?\.sector_category/g, '');
       content = parts.join('</tbody>');
       fs.writeFileSync(file, content);
       console.log('Fixed trailing item references in ' + file);
     }
  }
}
