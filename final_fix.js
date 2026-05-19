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
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  
  let inMapLoop = false;
  let bracketDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const lineStr = lines[i];
    
    // Detect start of map loop mapping 'item'
    if (lineStr.includes('paginatedData.map((item)')) {
       inMapLoop = true;
       bracketDepth = 0; // Reset depth for robustness
    }
    
    if (inMapLoop) {
       for (const char of lineStr) {
          if (char === '{') bracketDepth++;
          if (char === '}') bracketDepth--;
       }
       
       // If bracket depth drops to 0 or below, we exited the loop.
       // However, paginatedData.map((item) => ( ... )) often uses parentheses. Let's just track the string '</tbody>' which definitively terminates the map loop.
       if (lineStr.includes('</tbody>')) {
           inMapLoop = false;
       }
    }
    
    // If we are NOT in the map loop, we strip the injecting string.
    if (!inMapLoop) {
       lines[i] = lines[i].replace(/,\s*item\?\.sector_category/g, '');
    }
  }
  
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Processed ' + file);
}
