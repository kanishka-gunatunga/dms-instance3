const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error("Please provide a file path.");
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf8');

// Find interface TableItem { [anything except 'sector_category'] }
// We can just find `interface TableItem {` and replace it with `interface TableItem {\n  sector_category: number;`
if (content.includes("interface TableItem {") && !content.includes("sector_category: number;")) {
  content = content.replace("interface TableItem {", "interface TableItem {\n  sector_category: number;");
  fs.writeFileSync(file, content);
  console.log(`Updated TableItem in ${file}`);
} else {
  console.log(`No change for TableItem in ${file}`);
}
