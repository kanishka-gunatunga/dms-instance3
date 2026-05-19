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
  
  // Split file into before and after <tbody>
  // Everything before <tbody> is outside the item loop.
  // Wait, what if there's a file with multiple <tbody>? Usually there's only one.
  if (content.includes('<tbody>')) {
     const parts = content.split('<tbody>');
     parts[0] = parts[0].replace(/,\s*item\?\.sector_category/g, '');
     content = parts.join('<tbody>');
     fs.writeFileSync(file, content);
     console.log('Fixed ' + file);
  }
}
